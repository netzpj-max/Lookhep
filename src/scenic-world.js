import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const noise=new ImprovedNoise(),matrix=new THREE.Object3D();
const clamp=x=>Math.max(0,Math.min(1,x));

export function makeSurfaceTextures(renderer,kind='ground'){
  const size=kind==='ice'?512:1024;
  const albedo=document.createElement('canvas'),height=document.createElement('canvas'),rough=document.createElement('canvas');
  const maps=[albedo,height,rough];maps.forEach(c=>{c.width=c.height=size;});
  const contexts=maps.map(c=>c.getContext('2d')),images=contexts.map(c=>c.createImageData(size,size));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=x/size*16,py=y/size*16;
    const a=noise.noise(px,py,4)*.5+.5,b=noise.noise(px*4,py*4,17)*.5+.5,c=noise.noise(px*16,py*16,32)*.5+.5;
    const k=(y*size+x)*4;
    const pore=Math.pow(Math.max(0,(b-.47)*2),3),grain=a*.45+b*.35+c*.2;
    const wet=clamp((noise.noise(px*.25,py*.25,8)+.1)*2);
    const rgb=kind==='ice'?[205+grain*43,220+grain*30,231+grain*23]:[42+grain*34-wet*12,47+grain*37-wet*10,36+grain*32-wet*6];
    const h=kind==='ice'?140+grain*60-pore*100:grain*230;
    const r=kind==='ice'?50+pore*160:180-wet*140+c*30;
    for(let channel=0;channel<3;channel++){images[0].data[k+channel]=rgb[channel];images[1].data[k+channel]=h;images[2].data[k+channel]=r;}
    images.forEach(im=>{im.data[k+3]=255;});
  }
  return maps.map((canvas,i)=>{
    contexts[i].putImageData(images[i],0,0);
    const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    if(i===0)t.colorSpace=THREE.SRGBColorSpace;
    t.repeat.setScalar(kind==='ice'?2:5);return t;
  });
}

export function buildSky(owner){
  owner.skyUniforms={uFlash:{value:0},uEye:{value:new THREE.Vector3()}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(90,32,20),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,uniforms:owner.skyUniforms,
    vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.0);}`,
    fragmentShader:`varying vec3 vWorld;uniform vec3 uEye;uniform float uFlash;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
      void main(){vec3 rd=normalize(vWorld-uEye);float horizon=exp(-abs(rd.y)*6.0);
        vec3 c=mix(vec3(.009,.018,.036),vec3(.075,.105,.14),horizon);
        vec3 sun=normalize(vec3(-.72,.48,-.32));float glow=pow(max(dot(rd,sun),0.0),34.0);
        c+=vec3(.67,.39,.16)*glow*.38;
        float sheet=n(rd.xz*10.0+rd.y*4.0)*.55+n(rd.xz*26.0)*.3+n(rd.xz*60.0)*.15;
        c*=1.0-smoothstep(.35,.8,sheet)*.37*smoothstep(.02,.4,rd.y);
        c+=vec3(.13,.19,.28)*uFlash;gl_FragColor=vec4(c,1.0);
      }`,
  }));
  sky.onBeforeRender=(_r,_s,camera)=>owner.skyUniforms.uEye.value.copy(camera.position);
  sky.renderOrder=-10;owner.sky=sky;owner.scene.add(sky);
}

function leafTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
  // Every card contains a branch with separately cut-out leaves, rather than a solid crown.
  ctx.strokeStyle='#777';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(64,123);ctx.bezierCurveTo(52,82,75,42,64,5);ctx.stroke();
  for(let i=0;i<11;i++){
    const y=10+i*10,x=63+Math.sin(i)*6,side=i%2?1:-1;
    ctx.save();ctx.translate(x,y);ctx.rotate(side*.75);ctx.fillStyle='white';ctx.beginPath();ctx.ellipse(side*12,0,17,6.5,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  return new THREE.CanvasTexture(canvas);
}

export function buildLandscape(owner,random){
  const group=new THREE.Group();owner.terrain=group;owner.scene.add(group);
  const [map,bumpMap,roughnessMap]=makeSurfaceTextures(owner.renderer);
  const geo=new THREE.PlaneGeometry(19,15,180,140);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position,colors=[],col=new THREE.Color();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),h=owner.groundHeight(x,z);p.setY(i,h);
    const n=noise.noise(x*.42,3,z*.42)*.5+.5;
    col.setRGB(.62+n*.38,.70+n*.30,.58+n*.4);colors.push(col.r,col.g,col.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const ground=owner.mesh(geo,new THREE.MeshPhysicalMaterial({color:0xffffff,map,bumpMap,bumpScale:.07,roughnessMap,roughness:.92,clearcoat:.38,clearcoatRoughness:.22,vertexColors:true}),0,0,0,group);
  ground.receiveShadow=true;owner.ground=ground;
  // Exposed soil gives the educational landscape a physical thickness.
  owner.mesh(new THREE.BoxGeometry(19,.42,15),owner.material(0x202623,{roughness:1}),0,-.19,0,group);
  owner.line([new THREE.Vector3(-9.5,0,7.5),new THREE.Vector3(9.5,0,7.5)],0xa6afa2,.14,group);
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.065,1,7),owner.material(0x514439,{bumpMap,bumpScale:.12}),64);
  const leafMap=leafTexture();
  const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(.5,.5),new THREE.MeshPhysicalMaterial({color:0xaeb877,alphaMap:leafMap,alphaTest:.4,side:THREE.DoubleSide,roughness:.82,clearcoat:.25,clearcoatRoughness:.4}),64*72);
  trunks.castShadow=trunks.receiveShadow=true;leaves.castShadow=leaves.receiveShadow=true;leaves.userData.skipAO=true;
  leaves.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,alphaMap:leafMap,alphaTest:.4,side:THREE.DoubleSide});
  owner.windUniform={value:0};
  leaves.material.onBeforeCompile=shader=>{
    shader.uniforms.uWind=owner.windUniform;
    shader.vertexShader='uniform float uWind;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 root=instanceMatrix[3].xyz;
      transformed.x+=sin(uWind*1.8+root.x*3.0+root.z)*.045*uv.y;
      transformed.z+=cos(uWind*1.3+root.z*2.0)*.022*uv.y;`);
  };
  leaves.material.customProgramCacheKey=()=> 'lookhep-leaves-v2';
  let tree=0,leaf=0;
  for(let i=0;i<80&&tree<64;i++){
    const x=(random()-.5)*17,z=(random()-.5)*12;
    if(x>1.5&&x<5&&z>-1.1&&z<2.4)continue;
    const h=owner.groundHeight(x,z),height=.65+random()*.65;
    matrix.position.set(x,h+height*.4,z);matrix.rotation.set(0,random()*6,random()*.08);matrix.scale.set(1,height*.8,1);matrix.updateMatrix();trunks.setMatrixAt(tree,matrix.matrix);
    const tint=new THREE.Color().setHSL(.23+random()*.06,.20+random()*.15,.20+random()*.09);
    for(let j=0;j<72;j++){
      const az=random()*Math.PI*2,polar=Math.acos(random()*2-1),r=Math.cbrt(random())*height*.43;
      matrix.position.set(x+Math.cos(az)*Math.sin(polar)*r,h+height*.8+Math.cos(polar)*r*1.1,z+Math.sin(az)*Math.sin(polar)*r);
      matrix.rotation.set(random()*3,az,random()*3);matrix.scale.setScalar(.65+random()*.6);matrix.updateMatrix();leaves.setMatrixAt(leaf,matrix.matrix);leaves.setColorAt(leaf,tint);leaf++;
    }tree++;
  }
  trunks.count=tree;leaves.count=leaf;group.add(trunks,leaves);owner.leaves=leaves;
  const grassGeo=new THREE.PlaneGeometry(.12,.22,1,2);grassGeo.translate(0,.11,0);
  const grass=new THREE.InstancedMesh(grassGeo,new THREE.MeshStandardMaterial({color:0x798157,alphaMap:leafMap,alphaTest:.45,side:THREE.DoubleSide,roughness:1}),3600);
  grass.userData.skipAO=true;
  for(let i=0;i<3600;i++){
    const x=(random()-.5)*18,z=(random()-.5)*14;
    matrix.position.set(x,owner.groundHeight(x,z),z);matrix.rotation.set(0,random()*6.28,0);matrix.scale.setScalar(.4+random()*.9);matrix.updateMatrix();grass.setMatrixAt(i,matrix.matrix);
  }
  group.add(grass);owner.grass=grass;
  const rockGeo=new THREE.IcosahedronGeometry(1,1);
  const rocks=new THREE.InstancedMesh(rockGeo,owner.material(0x66685c,{map,bumpMap,bumpScale:.06,roughness:.76}),130);
  for(let i=0;i<130;i++){
    const x=(random()-.5)*18,z=(random()-.5)*13,size=.04+random()*.14;
    matrix.position.set(x,owner.groundHeight(x,z)+size*.25,z);matrix.rotation.set(random()*3,random()*6,random()*3);matrix.scale.set(size*1.4,size*.65,size);matrix.updateMatrix();rocks.setMatrixAt(i,matrix.matrix);
  }rocks.castShadow=rocks.receiveShadow=true;group.add(rocks);
  owner.horizon=new THREE.Group();owner.scene.add(owner.horizon);
  const distantGround=new THREE.PlaneGeometry(170,170);distantGround.rotateX(-Math.PI/2);
  owner.mesh(distantGround,owner.material(0x38444a,{roughness:1}),0,-.5,-30,owner.horizon);
  for(let ridge=0;ridge<3;ridge++){
    const mountain=new THREE.PlaneGeometry(125,32,140,30);mountain.rotateX(-Math.PI/2);
    const mp=mountain.attributes.position;
    for(let i=0;i<mp.count;i++){
      const x=mp.getX(i),z=mp.getZ(i),edge=Math.sin((z+16)/32*Math.PI);
      const height=(4+noise.noise(x*.048,5+ridge,0)*7+noise.noise(x*.14,1,4+ridge)*2)*edge;
      mp.setY(i,Math.max(0,height));
    }mountain.computeVertexNormals();
    const mesh=owner.mesh(mountain,owner.material([0x36434b,0x465560,0x526373][ridge],{roughness:1}),0,-.5-ridge*.4,-28-ridge*21,owner.horizon);mesh.receiveShadow=true;
  }
  buildWater(owner);
  owner.impact=new THREE.Group();owner.scene.add(owner.impact);
  for(let i=0;i<3;i++){
    const ring=owner.mesh(new THREE.RingGeometry(.96,1,80),new THREE.MeshBasicMaterial({color:0xd4e2e9,side:THREE.DoubleSide,transparent:true,opacity:.35,depthWrite:false}),3,.063+i*.004,.5,owner.impact);ring.rotation.x=-Math.PI/2;
  }
}

function buildWater(owner){
  const shader={...Reflector.ReflectorShader,uniforms:{...Reflector.ReflectorShader.uniforms,uTime:{value:0},uFlash:{value:0}},
    vertexShader:`uniform mat4 textureMatrix;varying vec4 vUv;varying vec2 vLocal;
      void main(){vLocal=uv;vUv=textureMatrix*vec4(position,1.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime;uniform float uFlash;varying vec4 vUv;varying vec2 vLocal;
      void main(){
        vec2 p=vLocal*2.0-1.0;float r=length(p);if(r>.98)discard;
        float wave=sin(p.x*65.0+uTime*4.0)*sin(p.y*48.0-uTime*3.0)*.0014;
        float ripple=0.0;
        for(int i=0;i<8;i++){
          float j=float(i);vec2 center=vec2(sin(j*23.4),cos(j*11.7))*.68;
          float age=fract(uTime*.74+j*.133);float d=length(p-center);
          ripple+=sin((d-age*.9)*85.0)*exp(-abs(d-age*.9)*45.0)*(1.0-age)*.0015;
        }
        vec4 q=vUv;q.xy+=vec2(wave+ripple,wave-ripple)*q.w;
        vec3 reflected=texture2DProj(tDiffuse,q).rgb;
        float edge=1.0-smoothstep(.76,.98,r);
        vec3 c=mix(vec3(.06,.095,.12),reflected,.58)*(.85+.15*edge);
        c+=vec3(.25,.37,.5)*uFlash;gl_FragColor=vec4(c,.92*edge);
      }`,
  };
  owner.water=new Reflector(new THREE.PlaneGeometry(4.2,2.4),{shader,textureWidth:512,textureHeight:512,clipBias:.005,multisample:0});
  owner.water.position.set(3,.058,.65);owner.water.rotation.x=-Math.PI/2;
  owner.water.material.transparent=true;owner.water.material.depthWrite=false;
  owner.water.renderOrder=1;owner.water.userData.skipAO=true;owner.terrain.add(owner.water);
}

export function buildRain(owner){
  const quad=new THREE.PlaneGeometry(1,1),geometry=new THREE.InstancedBufferGeometry();
  geometry.index=quad.index;geometry.attributes.position=quad.attributes.position;geometry.attributes.uv=quad.attributes.uv;
  const seeds=new Float32Array(3200*4);
  owner.weatherSeeds.forEach((q,i)=>seeds.set([q.x,q.z,q.phase,q.length],i*4));
  geometry.setAttribute('aSeed',new THREE.InstancedBufferAttribute(seeds,4));geometry.instanceCount=owner.profile.particles;
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:{value:0},uFlash:{value:0}},
    vertexShader:`attribute vec4 aSeed;uniform float uTime;varying vec2 vUv;varying float vFade;
      void main(){vUv=uv;float age=fract(aSeed.z-uTime*.22);float y=.14+age*8.5;
        float x=aSeed.x*.57+2.0+sin(uTime*.04+aSeed.z*5.0)*.15;
        vec3 head=vec3(x,y,aSeed.y),tail=head+vec3(.045,-aSeed.w,.02);
        vec4 h=modelViewMatrix*vec4(head,1.0),t=modelViewMatrix*vec4(tail,1.0);
        vec2 axis=normalize((h.xy-t.xy)+vec2(.0001));vec2 across=vec2(-axis.y,axis.x);
        vec4 mv=mix(t,h,uv.y);mv.xy+=across*(uv.x-.5)*.024;
        gl_Position=projectionMatrix*mv;vFade=exp(-max(-mv.z-12.0,0.0)*.018)*smoothstep(.1,.32,y);
      }`,
    fragmentShader:`uniform float uFlash;varying vec2 vUv;varying float vFade;
      void main(){float edge=1.0-abs(vUv.x*2.0-1.0);float tail=smoothstep(0.0,.6,vUv.y);gl_FragColor=vec4(vec3(.54,.66,.73)+uFlash*.4,edge*tail*vFade*.35);}`,
  });
  owner.rainGeo=geometry;owner.rain=new THREE.Mesh(geometry,material);owner.rain.frustumCulled=false;owner.weather.add(owner.rain);
}

export function buildSpray(owner,random){
  const count=720,positions=new Float32Array(count*3),seeds=new Float32Array(count*4);
  for(let i=0;i<count;i++){
    const x=(random()-.5)*8+1.8,z=(random()-.5)*6;
    positions[i*3]=x;positions[i*3+1]=owner.groundHeight(x,z)+.018;positions[i*3+2]=z;
    seeds.set([random(),random()*6.28,.035+random()*.10,random()],i*4);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('aSeed',new THREE.BufferAttribute(seeds,4));
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uRatio:{value:1},uFlash:{value:0}},
    vertexShader:`uniform float uTime,uRatio;attribute vec4 aSeed;varying float vAlpha;
      void main(){float age=fract(uTime*1.2+aSeed.x);vec3 p=position;
        float height=4.0*age*(1.0-age)*aSeed.z;
        p.xz+=vec2(cos(aSeed.y),sin(aSeed.y))*age*aSeed.z*1.4;p.y+=height;
        vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(uRatio*(12.0+aSeed.w*9.0)/max(-mv.z,.2),1.0,5.0);vAlpha=(1.0-age)*.45;
      }`,
    fragmentShader:`uniform float uFlash;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;float a=smoothstep(.5,.16,r)*vAlpha;gl_FragColor=vec4(vec3(.55,.70,.77)+uFlash*.3,a);}`,
  });
  const points=new THREE.Points(geo,mat);points.frustumCulled=false;owner.weather.add(points);owner.spray=points;
  const mistCanvas=document.createElement('canvas');mistCanvas.width=mistCanvas.height=64;const ctx=mistCanvas.getContext('2d');
  const g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(195,213,223,.4)');g.addColorStop(1,'rgba(195,213,223,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
  const mistMap=new THREE.CanvasTexture(mistCanvas);owner.mist=[];
  for(let i=0;i<8;i++){
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:mistMap,transparent:true,opacity:.11,depthWrite:false,color:0x99b1c2}));
    sprite.position.set((random()-.5)*8,.3+random()*.5,(random()-.5)*4);sprite.scale.set(3.5,1.3,1);owner.weather.add(sprite);owner.mist.push(sprite);
  }
}
