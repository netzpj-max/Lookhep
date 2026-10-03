import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { cloudVertex, cloudFragment } from './cloud-shader.js';
import { QUALITIES, initialQuality } from './render-quality.js';
import { CinematicShader } from './cinematic-shader.js';
import { ContactAO } from './contact-ao.js';
import { buildSky, buildLandscape, buildSpray, buildRain, makeSurfaceTextures } from './scenic-world.js';

const V = (x,y,z) => new THREE.Vector3(x,y,z);
const noise = new ImprovedNoise();
const dummy = new THREE.Object3D();
const up = V(0,1,0);
let seed=91;
const random = () => { seed=seed*16807%2147483647; return (seed-1)/2147483646; };
const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));

export class StormScene {
  constructor(container,label) {
    this.container=container; this.label=label;
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0x101c29);
    this.scene.fog=new THREE.FogExp2(0x344653,.011);
    this.camera=new THREE.PerspectiveCamera(35,1,.15,130);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.24;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    container.append(this.renderer.domElement);
    const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    this.gpuName=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
    let saved; try { saved=localStorage.getItem('lookhep-quality'); } catch {}
    this.quality=QUALITIES[saved]?saved:initialQuality(this.gpuName,matchMedia('(max-width:600px)').matches);
    this.profile=QUALITIES[this.quality]; this.study=false;
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.08;
    this.controls.minDistance=9;this.controls.maxDistance=52;
    this.controls.minPolarAngle=.15;this.controls.maxPolarAngle=Math.PI*.53;
    this.dirty=true;this.controls.addEventListener('change',()=>{this.dirty=true;});
    this.resetCamera();
    this.buildLighting();
    buildSky(this);
    this.buildTerrain();
    this.buildAtmosphere();
    this.buildClouds();
    this.buildFlows();
    this.buildHail();
    this.buildWeather();
    this.buildCutaway();
    this.setStudy(false);
    this.composer=new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.ao=new ContactAO(this);this.composer.addPass(this.ao);
    this.bloom=new UnrealBloomPass(new THREE.Vector2(800,500),.20,.6,1.15);
    this.composer.addPass(this.bloom);
    this.grade=new ShaderPass(CinematicShader);this.grade.uniforms.uResolution.value=new THREE.Vector2(800,500);
    this.composer.addPass(this.grade);this.composer.addPass(new OutputPass());
    this.cutawayLabel=document.createElement('div');this.cutawayLabel.className='cutaway-label';this.cutawayLabel.hidden=true;container.parentElement.append(this.cutawayLabel);
    this.stats={fps:0,frames:0,since:performance.now(),last:performance.now(),cpuSamples:[]};
    this.setQuality(this.quality,false);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.setCameraView('storm');
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;container.dispatchEvent(new CustomEvent('render-status',{detail:'การแสดงผล 3D หยุดชั่วคราว กรุณาโหลดหน้าใหม่'}));});
    this.renderer.domElement.addEventListener('webglcontextrestored',()=>{this.contextLost=false;});
  }
  material(color,options={}) {return new THREE.MeshStandardMaterial({color,roughness:.78,...options});}
  mesh(geometry,material,x=0,y=0,z=0,group=this.scene) {const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);group.add(m);return m;}
  line(points,color,opacity=1,group=this.scene,dashed=false) {
    const geometry=new THREE.BufferGeometry().setFromPoints(points);
    const material=dashed?new THREE.LineDashedMaterial({color,opacity,transparent:true,dashSize:.16,gapSize:.17}):new THREE.LineBasicMaterial({color,opacity,transparent:true});
    const line=new THREE.Line(geometry,material);if(dashed)line.computeLineDistances();group.add(line);return line;
  }
  resetCamera() {this.cameraView='overview';this.followHail=false;this.controls.minDistance=9;this.controls.maxPolarAngle=Math.PI*.53;this.camera.fov=35;this.camera.updateProjectionMatrix();this.camera.position.set(19.5,11.7,24.5);this.controls.target.set(-.1,7.2,0);this.controls.update();this.dirty=true;}
  setCameraView(mode){
    if(this.followHail)this.setCloseup(false);
    this.cameraView=mode;this.controls.minDistance=mode==='ground'?2:9;this.controls.maxPolarAngle=mode==='ground'?2.5:1.9;
    if(mode==='ground'){this.camera.fov=62;this.camera.position.set(7,1.35,9);this.controls.target.set(-.6,8,-.5);}
    else if(mode==='storm'||mode==='orbit'){this.camera.fov=45;this.camera.position.set(12,3.8,23);this.controls.target.set(-.3,7.2,0);}
    else{this.resetCamera();}
    this.camera.updateProjectionMatrix();this.controls.update();this.dirty=true;
  }
  setCloseup(enabled) {
    if(enabled&&this.followHail)return;
    this.followHail=enabled;
    if(enabled){
      this.savedCamera={view:this.cameraView,position:this.camera.position.clone(),target:this.controls.target.clone(),fov:this.camera.fov};
      this.closeupVisibility={clouds:this.clouds.visible,weather:this.weather.visible,flows:this.flows.visible,trail:this.trail.visible,terrain:this.terrain.visible,horizon:this.horizon.visible,sky:this.sky.visible};
      this.clouds.visible=this.weather.visible=this.flows.visible=this.trail.visible=this.terrain.visible=this.horizon.visible=this.sky.visible=false;
      this.studio.visible=true;this.scene.background.setHex(0x121c27);this.scene.fog.density=0;
      this.camera.fov=32;this.camera.updateProjectionMatrix();
      this.controls.minDistance=.8;this.controls.target.copy(this.hail.position);this.camera.position.copy(this.hail.position).add(V(1.1,.5,1.9));this.controls.update();this.atmosphere.visible=false;
    }
    else {this.restoreVisibility();this.studio.visible=false;this.scene.fog.density=.011;this.resetCamera();this.atmosphere.visible=this.study;
      if(this.savedCamera){const c=this.savedCamera;this.cameraView=c.view;this.camera.position.copy(c.position);this.controls.target.copy(c.target);this.camera.fov=c.fov;this.camera.updateProjectionMatrix();this.controls.minDistance=c.view==='ground'?2:9;this.controls.maxPolarAngle=c.view==='ground'?2.5:c.view==='overview'?Math.PI*.53:1.9;this.controls.update();this.savedCamera=null;}
    }
    this.dirty=true;
  }
  restoreVisibility(){if(!this.closeupVisibility)return;for(const [key,visible]of Object.entries(this.closeupVisibility))this[key].visible=visible;this.closeupVisibility=null;}
  buildLighting() {
    this.scene.add(new THREE.HemisphereLight(0xb2c9ed,0x474038,.9));
    this.sun=new THREE.DirectionalLight(0xffd5a0,3.4);this.sun.position.set(-16,19,-9);this.sun.castShadow=true;
    Object.assign(this.sun.shadow.camera,{left:-12,right:12,top:18,bottom:-7,near:1,far:50});
    this.sun.shadow.bias=-.0004;this.sun.shadow.normalBias=.04;this.sun.shadow.radius=3;this.scene.add(this.sun);
    const rim=new THREE.DirectionalLight(0x93b5ed,1.0);rim.position.set(8,10,9);this.scene.add(rim);
    this.flashLight=new THREE.PointLight(0xbbd4ff,0,21,1.6);this.flashLight.position.set(.7,4,0);this.scene.add(this.flashLight);
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');
    const g=ctx.createLinearGradient(0,0,0,512);g.addColorStop(0,'#7c98b1');g.addColorStop(.46,'#c9d6dc');g.addColorStop(.54,'#657d86');g.addColorStop(1,'#1c2428');ctx.fillStyle=g;ctx.fillRect(0,0,1024,512);
    const light=ctx.createRadialGradient(280,145,0,280,145,110);light.addColorStop(0,'rgba(255,255,255,1)');light.addColorStop(.2,'rgba(242,249,255,.85)');light.addColorStop(1,'rgba(242,249,255,0)');ctx.fillStyle=light;ctx.fillRect(0,0,1024,512);
    const tex=new THREE.CanvasTexture(canvas);tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;
    const pmrem=new THREE.PMREMGenerator(this.renderer);this.environment=pmrem.fromEquirectangular(tex);this.scene.environment=this.environment.texture;tex.dispose();pmrem.dispose();
    this.studio=new THREE.Group();this.scene.add(this.studio);this.studio.visible=false;
    for(const [color,intensity,position]of [[0xe8f6ff,3.5,[-3,5,4]],[0x82adcf,2,[4,2,-3]],[0xffe9c4,1.8,[-2,-1,-3]]]){
      const light=new THREE.DirectionalLight(color,intensity);light.position.set(...position);this.studio.add(light);this.studio.add(light.target);
    }
  }
  groundHeight(x,z) {const back=clamp((-z-1)/5);return .045+back*(.35+noise.noise(x*.32,0,z*.4)*1.1)+Math.pow(back,2)*(1.5+Math.sin(x*.8+1)*.65);}
  buildTerrain() { buildLandscape(this,random); }
  buildAtmosphere() {
    this.atmosphere=new THREE.Group();this.scene.add(this.atmosphere);
    for(const [y,color] of [[5,0x6cabb4],[10,0x839ab3],[15,0x809eb8]])this.line([V(-6,y,-4),V(6,y,-4),V(6,y,4),V(-6,y,4),V(-6,y,-4)],color,.18,this.atmosphere,true);
    for(let y=0;y<=15;y++)this.line([V(-6,y,4),V(-5.85,y,4)],0x98b7c9,.24,this.atmosphere);
  }
  buildClouds() {
    this.clouds=new THREE.Group();this.scene.add(this.clouds);
    this.cloudUniforms={uDensity:{value:null},uDetail:{value:null},uCamera:{value:new THREE.Vector3()},uHail:{value:new THREE.Vector3()},uTime:{value:0},uStudy:{value:0},uFlash:{value:0},uSteps:{value:this.profile.steps},uLightSteps:{value:this.profile.lightSteps}};
    const mat=new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,vertexShader:cloudVertex,fragmentShader:cloudFragment,uniforms:this.cloudUniforms,side:THREE.BackSide,transparent:true,depthWrite:false,depthTest:true});
    this.volume=this.mesh(new THREE.BoxGeometry(1,1,1),mat,-.5,8.5,0,this.clouds);this.volume.scale.set(13,15,9);this.volume.renderOrder=2;this.volume.visible=false;
    this.volume.onBeforeRender=(_renderer,_scene,camera)=>{this.cloudUniforms.uCamera.value.copy(camera.position);this.volume.worldToLocal(this.cloudUniforms.uCamera.value);};
    this.ready=new Promise((resolve,reject)=>{this.cloudWorker=new Worker(new URL('./cloud-worker.js',import.meta.url),{type:'module'});this.cloudWorker.onmessage=({data})=>{const tex=new THREE.Data3DTexture(data.data,data.width,data.height,data.depth);tex.format=THREE.RedFormat;tex.type=THREE.UnsignedByteType;tex.minFilter=tex.magFilter=THREE.LinearFilter;tex.unpackAlignment=1;tex.needsUpdate=true;this.cloudUniforms.uDensity.value=tex;const detailTex=new THREE.Data3DTexture(data.detail,data.detailSize,data.detailSize,data.detailSize);detailTex.format=THREE.RedFormat;detailTex.type=THREE.UnsignedByteType;detailTex.minFilter=detailTex.magFilter=THREE.LinearFilter;detailTex.wrapS=detailTex.wrapT=detailTex.wrapR=THREE.RepeatWrapping;detailTex.unpackAlignment=1;detailTex.needsUpdate=true;this.cloudUniforms.uDetail.value=detailTex;this.volume.visible=true;this.cloudWorker.terminate();this.cloudReady=true;this.dirty=true;resolve();};this.cloudWorker.onerror=e=>{this.cloudWorker.terminate();reject(new Error(e.message||'ไม่สามารถสร้างเมฆปริมาตรได้'));};this.cloudWorker.postMessage({});});
  }
  buildFlows() {
    this.flows=new THREE.Group();this.scene.add(this.flows);this.flowParticles=[];
    const paths=[{points:[V(-3.7,.6,1.4),V(-2.7,3,1.3),V(-2.1,7,1.1),V(-1.8,11.5,.8)],color:0x6bd5df,up:true},{points:[V(-2.2,.7,2),V(-1.3,3,1.8),V(-.9,6,1.6),V(-1.1,10.8,1.4)],color:0x89dedb,up:true},{points:[V(1.8,10.4,.1),V(3.5,8.4,.5),V(3.7,4,1.2),V(4.6,.5,1.8)],color:0xe9a478,up:false}];
    for(const {points,color,up} of paths){const curve=new THREE.CatmullRomCurve3(points);const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.28,depthWrite:false,depthTest:false});const tube=this.mesh(new THREE.TubeGeometry(curve,80,.024,6,false),material,0,0,0,this.flows);tube.renderOrder=4;
      for(let i=0;i<3;i++){const cone=this.mesh(new THREE.ConeGeometry(.13,.42,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.78,depthTest:false,depthWrite:false}),0,0,0,this.flows);cone.renderOrder=5;this.flowParticles.push({mesh:cone,curve,offset:i/3,up});}}
    const orbit=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;orbit.push(V(-.1-.6*Math.cos(a)+1.3*Math.sin(a),6.9+1.7*Math.cos(a),.5+.6*Math.sin(a)));}
    this.orbitLine=this.line(orbit,0xa4dbe9,.4,this.flows,true);this.orbitLine.material.depthTest=false;this.orbitLine.renderOrder=5;
    this.trailBuffer=new Float32Array(180*3);this.trailGeometry=new THREE.BufferGeometry();this.trailGeometry.setAttribute('position',new THREE.BufferAttribute(this.trailBuffer,3).setUsage(THREE.DynamicDrawUsage));this.trailGeometry.setDrawRange(0,0);
    this.trail=new THREE.Line(this.trailGeometry,new THREE.LineBasicMaterial({color:0xafe3e4,transparent:true,opacity:.45,depthTest:false}));this.trail.renderOrder=5;this.scene.add(this.trail);this.trailCount=0;this.lastTime=0;
  }
  iceGeometry(radius=1,detail=5) {
    const geo=new THREE.SphereGeometry(radius,112,80),pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i)/radius,y=pos.getY(i)/radius,z=pos.getZ(i)/radius;const displacement=1+noise.noise(x*3.7+5,y*3.7,z*3.7)*.085+noise.noise(x*11,y*11+7,z*11)*.016;pos.setXYZ(i,x*radius*displacement,y*radius*displacement,z*radius*displacement);}
    geo.computeVertexNormals();return geo;
  }
  buildHail() {
    this.hail=new THREE.Group();this.scene.add(this.hail);
    const [iceMap,iceBump,iceRough]=makeSurfaceTextures(this.renderer,'ice');
    this.iceMaterial=new THREE.MeshPhysicalMaterial({color:0xe6f2f5,map:iceMap,bumpMap:iceBump,bumpScale:.032,roughnessMap:iceRough,roughness:.46,metalness:0,transmission:.68,thickness:1.2,ior:1.31,attenuationColor:new THREE.Color(0xb8d6df),attenuationDistance:2.8,clearcoat:1,clearcoatRoughness:.065,envMapIntensity:1.55,depthTest:false});
    this.hailCore=this.mesh(this.iceGeometry(),this.iceMaterial,0,0,0,this.hail);this.hailCore.renderOrder=7;
    this.iceNucleus=this.mesh(this.iceGeometry(.48),this.material(0xe3ebed,{bumpMap:iceBump,bumpScale:.06,roughness:.74,transparent:true,opacity:.68,depthTest:false}),0,0,0,this.hail);this.iceNucleus.renderOrder=6;
    for(const radius of [.68,.84]){
      const shell=this.mesh(new THREE.SphereGeometry(radius,48,32),this.material(0xcbdfe4,{roughness:.65,transparent:true,opacity:.10,depthWrite:false,depthTest:false,bumpMap:iceBump,bumpScale:.02}),0,0,0,this.hail);shell.renderOrder=6;
    }
    this.bubbles=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),this.material(0xf1f6f7,{roughness:.63,transparent:true,opacity:.55,depthTest:false}),100);this.bubbles.renderOrder=6;this.hail.add(this.bubbles);
    for(let i=0;i<100;i++){const direction=V(random()-.5,random()-.5,random()-.5).normalize();dummy.position.copy(direction).multiplyScalar(.78*Math.cbrt(random()));dummy.scale.setScalar(.008+random()*.021);dummy.updateMatrix();this.bubbles.setMatrixAt(i,dummy.matrix);}
    this.iceCracks=new THREE.Group();this.hail.add(this.iceCracks);
    for(let i=0;i<18;i++){
      const normal=V(random()-.5,random()-.5,random()-.5).normalize(),tangent=V(normal.y,-normal.x,.3).normalize(),points=[];
      for(let j=0;j<7;j++){const p=normal.clone().addScaledVector(tangent,(j-3)*.04).addScaledVector(up,Math.sin(j*1.6+i)*.018).normalize();const d=1+noise.noise(p.x*3.7+5,p.y*3.7,p.z*3.7)*.085+noise.noise(p.x*11,p.y*11+7,p.z*11)*.016;p.multiplyScalar(d+.004);points.push(p);}
      const crack=this.line(points,0xe8f5fa,.38,this.iceCracks);crack.renderOrder=8;crack.material.depthTest=false;
    }
    this.hailHalo=this.mesh(new THREE.TorusGeometry(1.36,.018,6,64),new THREE.MeshBasicMaterial({color:0xc1e9ef,transparent:true,opacity:.45,depthTest:false,depthWrite:false}),0,0,0,this.hail);this.hailHalo.renderOrder=9;
  }
  buildWeather() {
    this.weather=new THREE.Group();this.scene.add(this.weather);
    this.weatherSeeds=Array.from({length:3200},()=>({x:(random()-.5)*10,z:(random()-.5)*7,phase:random(),length:.1+random()*.18}));
    buildRain(this);
    this.smallHail=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),this.material(0xd8e7ec,{roughness:.35}),180);this.smallHail.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.weather.add(this.smallHail);
    this.lightning=new THREE.Group();this.weather.add(this.lightning);
    const bolt=[V(.3,9.5,-.5),V(-.2,8.4,-.4),V(.6,7.6,-.5),V(.2,6.7,-.3),V(.9,6.2,-.4),V(.5,5.1,-.3),V(.7,4.5,-.3),V(.5,3.8,-.4),V(.93,3.1,-.3),V(.6,2.5,-.15),V(1.15,2.7,-.12),V(.9,1.7,0),V(1.4,.05,.2)];
    for(const points of [bolt,[bolt[2],V(-.4,6.5,-.5),V(-.7,6.2,-.4),V(-.55,5.5,-.3),V(-1.2,4.8,-.2)],[bolt[8],V(.2,2.9,-.3),V(.05,2.4,-.3),V(-.4,2.2,-.3)]]){
      const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(points[i-1],points[i]));
      this.mesh(new THREE.TubeGeometry(path,points.length*4,.012,5,false),new THREE.MeshBasicMaterial({color:0xeaf4ff,toneMapped:false}),0,0,0,this.lightning);
      this.mesh(new THREE.TubeGeometry(path,points.length*4,.045,5,false),new THREE.MeshBasicMaterial({color:0x6da5ff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),0,0,0,this.lightning);
    }
    this.lightning.visible=false;
    buildSpray(this,random);
  }
  buildCutaway() {
    this.cutaway=new THREE.Group();this.cutaway.position.set(4.6,8,3.5);this.scene.add(this.cutaway);
    const shell=this.mesh(new THREE.SphereGeometry(1.3,64,32,0,Math.PI*2,Math.PI/2,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0xd4e7ee,roughness:.25,ior:1.31,clearcoat:1,envMapIntensity:1.4,side:THREE.DoubleSide,depthTest:false}),0,0,0,this.cutaway);shell.rotation.x=Math.PI/2;shell.renderOrder=10;
    this.sectionMaterial=new THREE.ShaderMaterial({transparent:false,depthTest:false,uniforms:{uLayers:{value:1}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
      varying vec2 vUv;uniform float uLayers;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){vec2 p=(vUv-.5)*2.0;float r=length(p),a=atan(p.y,p.x);float ripple=sin(a*7.0+r*15.0)*.012+sin(a*13.0)*.008;float layer=fract((r+ripple)*max(uLayers,1.0));float band=smoothstep(.1,.25,layer)*(1.0-smoothstep(.6,.82,layer));vec3 color=mix(vec3(.48,.66,.74),vec3(.83,.9,.93),band);float speck=hash(floor(vUv*600.0));color+=vec3(speck>.985?.18:-.015)*band;float core=1.0-smoothstep(.13,.2,r);color=mix(color,vec3(.88,.94,.97),core);color*=.9+.1*(1.0-r);gl_FragColor=vec4(color,1.0);#include <tonemapping_fragment>\n#include <colorspace_fragment>}
    `.replace(';#include',';\n#include')});
    const disc=this.mesh(new THREE.CircleGeometry(1.27,128),this.sectionMaterial,0,0,.015,this.cutaway);disc.renderOrder=11;
    this.cutaway.visible=false;
  }
  setQuality(name,persist=true) {
    if(!QUALITIES[name])return;
    this.dirty=true;this.initialWeather=false;
    this.quality=name;this.profile=QUALITIES[name];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,this.profile.pixelRatio));
    this.cloudUniforms.uSteps.value=this.profile.steps;this.cloudUniforms.uLightSteps.value=this.profile.lightSteps;
    this.rainGeo.instanceCount=this.profile.particles;this.bloom.enabled=this.profile.bloom;this.ao.enabled=this.profile.ao;
    this.grass.count=this.profile.grass;this.spray.geometry.setDrawRange(0,this.profile.spray);
    this.spray.material.uniforms.uRatio.value=this.renderer.getPixelRatio();
    this.water.visible=this.profile.reflections;this.water.getRenderTarget().setSize(this.profile.reflectionSize,this.profile.reflectionSize);
    const size=this.profile.shadows;
    if(this.sun.shadow.mapSize.x!==size){this.sun.shadow.mapSize.set(size,size);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.needsUpdate=true;}
    this.renderer.domElement.dataset.quality=name;
    this.renderer.domElement.dataset.gpu=this.gpuName;
    this.renderer.domElement.dataset.cloudSteps=String(this.profile.steps);
    this.renderer.domElement.dataset.rendererVersion='cinematic-2';
    this.renderer.domElement.dataset.reflections=String(this.profile.reflections);
    if(persist)try{localStorage.setItem('lookhep-quality',name);}catch{}
    this.resize();
  }
  setStudy(value){this.study=value;this.cloudUniforms.uStudy.value=value?1:0;this.atmosphere.visible=value;this.dirty=true;}
  setClouds(visible){if(this.followHail)this.closeupVisibility.clouds=visible;else this.clouds.visible=visible;this.dirty=true;}
  setFlow(visible){if(this.followHail){this.closeupVisibility.flows=visible;this.closeupVisibility.trail=visible;}else{this.flows.visible=visible;this.trail.visible=visible;}this.dirty=true;}
  resize() {
    const {width,height}=this.container.getBoundingClientRect();this.width=width;this.height=height;
    this.camera.aspect=width/Math.max(1,height);this.camera.updateProjectionMatrix();this.renderer.setSize(width,height);
    this.composer?.setPixelRatio(this.renderer.getPixelRatio());this.composer?.setSize(width,height);
    this.grade?.uniforms.uResolution.value.set(width*this.renderer.getPixelRatio(),height*this.renderer.getPixelRatio());
    this.dirty=true;
  }
  update(s,settings,cutaway) {
    if(s.time!==this.lastTime || cutaway!==this.lastCutaway || s.diameter!==this.current?.diameter || !this.initialWeather)this.dirty=true;
    this.lastCutaway=cutaway;
    this.current=s;
    this.windUniform.value=s.time;this.skyUniforms.uFlash.value=0;
    if(this.cameraView==='orbit'&&!this.followHail&&s.time!==this.lastTime){const angle=.48+s.time*.035;this.camera.position.set(Math.sin(angle)*24,5.2+Math.sin(s.time*.025)*1.3,Math.cos(angle)*24);this.dirty=true;}
    const p=s.position,r=s.stage===0?.12:.16+s.diameter/50*.44;
    const groundY=this.groundHeight(p.x,p.z)+r+.015;
    const bounce=s.stage===5?Math.abs(Math.sin(s.phase*Math.PI*3))*.38*Math.exp(-s.phase*6):0;
    this.hail.position.set(p.x,Math.max(p.y+.15,groundY)+bounce,p.z);this.hail.scale.setScalar(r);
    this.studio.position.copy(this.hail.position);
    if(this.followHail){const delta=this.hail.position.clone().sub(this.controls.target);this.controls.target.copy(this.hail.position);this.camera.position.add(delta);}
    this.hailCore.rotation.set(s.time*.29,s.time*.47,s.time*.12);this.bubbles.rotation.copy(this.hailCore.rotation);
    this.iceMaterial.color.setHex(s.stage===0?0xb2dde9:0xe6f2f5);this.iceMaterial.transmission=s.stage===0?.87:.68;
    this.iceCracks.visible=s.stage>0;this.iceCracks.rotation.copy(this.hailCore.rotation);
    this.iceNucleus.visible=this.bubbles.visible=s.stage>0;this.hailHalo.quaternion.copy(this.camera.quaternion);
    this.hailHalo.visible=!this.followHail;
    this.flowParticles.forEach(({mesh,curve,offset,up:isUp})=>{const t=(s.time*(isUp?settings.updraft/100:1)*.07+offset)%1;mesh.position.copy(curve.getPoint(t));mesh.quaternion.setFromUnitVectors(up,curve.getTangent(t).normalize());});
    this.orbitLine.material.opacity=s.stage===2?.4:.09;
    this.cloudUniforms.uTime.value=s.time;
    const flash=s.stage>=2&&s.stage<5&&(Math.floor(s.time*8)%83===0||Math.floor(s.time*8)%83===2)?1:0;
    this.cloudUniforms.uFlash.value=flash;this.flashLight.intensity=flash*36;this.lightning.visible=Boolean(flash);
    this.skyUniforms.uFlash.value=flash;this.water.material.uniforms.uTime.value=s.time;this.water.material.uniforms.uFlash.value=flash;
    this.spray.material.uniforms.uTime.value=s.time;this.spray.material.uniforms.uFlash.value=flash;
    this.rain.material.uniforms.uTime.value=s.time;this.rain.material.uniforms.uFlash.value=flash;
    this.mist.forEach((sprite,i)=>{sprite.position.x=Math.sin(s.time*.09+i*2)*3+1;sprite.material.opacity=.07+Math.sin(s.time*.2+i)*.025;});
    // All weather uses simulation time, so pausing freezes clouds, rain and lightning.
    if(s.time!==this.lastTime || !this.initialWeather) {
      this.initialWeather=true;
      for(let i=0;i<180;i++){const q=this.weatherSeeds[i+200];dummy.position.set(q.x*.65+1.2,.1+((q.phase-s.time*.15)%1+1)%1*7,q.z*.65);dummy.scale.setScalar(.018+(i%7)*.006);dummy.rotation.set(s.time+i,s.time*.3,0);dummy.updateMatrix();this.smallHail.setMatrixAt(i,dummy.matrix);}this.smallHail.instanceMatrix.needsUpdate=true;
    }
    this.smallHail.visible=s.stage>=2;
    this.impact.visible=s.stage===5;
    this.impact.children.forEach((ring,i)=>{const t=(s.phase*2+i/3)%1;ring.scale.setScalar(.25+t*1.2);ring.material.opacity=(1-t)*.32;});
    if(s.time<this.lastTime||Math.abs(s.time-this.lastTime)>.6)this.trailCount=0;
    if(s.time!==this.lastTime){if(this.trailCount===180){this.trailBuffer.copyWithin(0,3);this.trailCount=179;}const i=this.trailCount++*3;this.trailBuffer[i]=p.x;this.trailBuffer[i+1]=p.y+.15;this.trailBuffer[i+2]=p.z;this.trailGeometry.attributes.position.needsUpdate=true;this.trailGeometry.setDrawRange(0,this.trailCount);this.trailGeometry.computeBoundingSphere();}
    this.lastTime=s.time;this.trail.material.color.setHex(s.stage>=4?0xf4ba96:0xafe3e4);
    this.cutaway.visible=cutaway&&s.stage>0;this.cutawayLabel.hidden=!this.cutaway.visible;this.cutaway.quaternion.copy(this.camera.quaternion);this.sectionMaterial.uniforms.uLayers.value=Math.max(1,s.layers);this.cutawayLabel.textContent=`โครงสร้างขยาย · ${s.layers} ชั้น`;
    this.ao.enabled=this.profile.ao&&!this.followHail;
    this.projectLabel(this.hail.position,this.label,22,-24);this.projectLabel(this.cutaway.position,this.cutawayLabel,-68,63);
  }
  projectLabel(point,element,dx,dy){const p=point.clone().project(this.camera),x=(p.x*.5+.5)*this.width+dx,y=(-p.y*.5+.5)*this.height+dy;element.style.left=`${clamp(x,8,Math.max(8,this.width-element.offsetWidth-8))}px`;element.style.top=`${clamp(y,10,this.height-45)}px`;element.style.visibility=p.z>1?'hidden':'visible';}
  render() {
    if(this.contextLost)return;
    this.controls.update();
    if(!this.dirty)return;
    this.dirty=false;this.volume.updateMatrixWorld();
    this.cloudUniforms.uCamera.value.copy(this.camera.position);this.volume.worldToLocal(this.cloudUniforms.uCamera.value);
    this.cloudUniforms.uHail.value.copy(this.hail.position);this.volume.worldToLocal(this.cloudUniforms.uHail.value);
    const start=performance.now();this.composer.render();const now=performance.now();
    if(start-this.stats.last>250){this.stats.since=start;this.stats.frames=0;}
    this.stats.last=now;this.stats.frames++;this.stats.cpuSamples.push(now-start);if(this.stats.cpuSamples.length>120)this.stats.cpuSamples.shift();
    if(now-this.stats.since>=1200){this.stats.fps=Math.round(this.stats.frames*1000/(now-this.stats.since));this.stats.frames=0;this.stats.since=now;this.renderer.domElement.dataset.fps=String(this.stats.fps);}
    this.renderer.domElement.dataset.cloudReady=String(Boolean(this.cloudReady));
    this.renderer.domElement.dataset.frames=String((Number(this.renderer.domElement.dataset.frames)||0)+1);
    this.renderer.domElement.dataset.cameraView=this.followHail?'closeup':this.cameraView;
    this.renderer.domElement.dataset.weatherTime=String(this.current?.time||0);
  }
}
