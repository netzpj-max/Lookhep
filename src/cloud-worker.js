import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

// Build once off the UI thread. Density is sampled in world units, not from meshes.
const noise = new ImprovedNoise();
const lobes = [
  [-1,3,0,3.7,1.35,2.8], [1.2,3.3,-0.4,2.8,1.5,2.5],
  [-1.3,5.1,0,2.25,2.3,2.15], [-0.4,7.1,-0.1,2.3,2.6,2.05],
  [-1.1,9.3,0,2.75,2.3,2.3], [0.5,10.7,-0.5,2.6,2.2,2.15],
  [-2,11.7,0.4,2.4,2.1,2.2], [-0.7,12.8,0,3.0,2.0,2.3],
  [-3.2,13.4,-0.2,2.5,1.55,2.3], [2.25,13.7,-0.5,3.2,1.25,2.2],
  [-1.3,14.1,-0.2,4.7,1.15,2.6], [3.9,14.0,-0.5,2.0,0.75,1.8],
  [-2.5,8.2,0.9,1.25,1.65,1.35], [1,6,0.5,1.35,1.7,1.2],
  [1.3,9.1,0.8,1.4,1.55,1.25], [-2.4,10.2,-0.7,1.4,1.6,1.4],
];
const clamp = x => Math.min(1,Math.max(0,x));

self.onmessage = () => {
  const width=128,height=160,depth=96;
  const data=new Uint8Array(width*height*depth);
  let index=0;
  for(let z=0;z<depth;z++) for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const wx=(x/(width-1)-0.5)*13-0.5,wy=1+y/(height-1)*15,wz=(z/(depth-1)-0.5)*9;
    let shape=-10;
    for(const l of lobes){const qx=(wx-l[0])/l[3],qy=(wy-l[1])/l[4],qz=(wz-l[2])/l[5];shape=Math.max(shape,1-Math.sqrt(qx*qx+qy*qy+qz*qz));}
    if(shape < -0.19 || wy < 1.9) { index++; continue; }
    const a=noise.noise(wx*.7+13,wy*.7,wz*.7+5);
    const b=noise.noise(wx*1.6+50,wy*1.6+3,wz*1.6);
    const c=noise.noise(wx*3.7,wy*3.7+25,wz*3.7);
    const d=noise.noise(wx*8.1+7,wy*8.1,wz*8.1+19);
    const turbulence=a*.25+b*.13+c*.055+d*.024;
    const edge=clamp((shape+turbulence-.025)*4.6);
    const bottom=clamp((wy-1.9)*2.6);
    const density=edge*bottom*(.63+a*.27+b*.13);
    data[index++]=Math.round(clamp(density)*255);
  }
  self.postMessage({data,width,height,depth},[data.buffer]);
};
