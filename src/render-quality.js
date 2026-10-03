export const QUALITIES = {
  balanced: { label:'สมดุล', pixelRatio:1, steps:48, lightSteps:3, particles:600, shadows:1024, bloom:false, ao:false, reflections:false, reflectionSize:256, grass:1200, spray:180 },
  high: { label:'สูง', pixelRatio:1.35, steps:88, lightSteps:5, particles:1600, shadows:2048, bloom:true, ao:true, reflections:true, reflectionSize:384, grass:2400, spray:420 },
  ultra: { label:'Ultra', pixelRatio:1.75, steps:144, lightSteps:8, particles:3200, shadows:4096, bloom:true, ao:true, reflections:true, reflectionSize:768, grass:3600, spray:720 },
};

export function initialQuality(rendererName='', mobile=false) {
  if(/swiftshader|llvmpipe|software/i.test(rendererName)) return 'balanced';
  if(/RTX\s*(40[6789]0|50[6789]0)/i.test(rendererName)) return 'ultra';
  return mobile ? 'balanced' : 'high';
}
