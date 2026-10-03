// Linear HDR colour grading is applied before OutputPass tone mapping.
export const CinematicShader = {
  uniforms: { tDiffuse: { value:null }, uStrength:{ value:1 }, uResolution:{ value:null } },
  vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`
    uniform sampler2D tDiffuse; uniform float uStrength; uniform vec2 uResolution;
    varying vec2 vUv;
    void main(){
      vec3 c=texture2D(tDiffuse,vUv).rgb;
      float luminance=dot(c,vec3(.2126,.7152,.0722));
      vec3 shadows=vec3(.91,.98,1.06), highlights=vec3(1.06,1.015,.94);
      vec3 grade=c*mix(shadows,highlights,smoothstep(.08,1.6,luminance));
      grade=mix(vec3(luminance),grade,1.035);
      vec2 p=vUv*2.0-1.0;
      float vignette=1.0-.17*smoothstep(.35,1.55,dot(p,p));
      // Stable, sub-pixel dither avoids temporal noise while paused.
      float dither=fract(sin(dot(floor(vUv*uResolution),vec2(12.9898,78.233)))*43758.5453)-.5;
      gl_FragColor=vec4(max(mix(c,grade*vignette,uStrength)+dither/1800.0,vec3(0.0)),1.0);
    }
  `,
};
