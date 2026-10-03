import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

// Volumes, mirrors and transparent teaching overlays must not become opaque
// proxy geometry in the normal/depth pass used for contact occlusion.
export class ContactAO extends SSAOPass {
  constructor(owner){
    super(owner.scene,owner.camera,800,500,16);this.owner=owner;
    this.kernelRadius=.32;this.minDistance=.0002;this.maxDistance=.025;
  }
  render(...args){
    const o=this.owner,hidden=[];
    for(const item of [o.sky,o.clouds,o.weather,o.flows,o.hail,o.trail,o.cutaway,o.water,o.leaves,o.grass]){
      if(item){hidden.push([item,item.visible]);item.visible=false;}
    }
    try{super.render(...args);}finally{for(const [item,visible]of hidden)item.visible=visible;}
  }
}
