export const cloudVertex = `
  out vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const cloudFragment = `
  precision highp float;
  precision highp sampler3D;
  uniform sampler3D uDensity;
  uniform vec3 uCamera;
  uniform vec3 uHail;
  uniform float uTime;
  uniform float uStudy;
  uniform float uFlash;
  uniform int uSteps;
  uniform int uLightSteps;
  in vec3 vLocal;
  out vec4 outColor;
  const vec3 scale = vec3(13.0,15.0,9.0);
  const vec3 sun = normalize(vec3(-0.6,0.8,0.45));

  vec2 boxHit(vec3 ro, vec3 rd) {
    vec3 inv = 1.0 / rd;
    vec3 lo = (-0.5-ro)*inv, hi = (0.5-ro)*inv;
    vec3 mn=min(lo,hi), mx=max(lo,hi);
    return vec2(max(max(mn.x,mn.y),mn.z),min(min(mx.x,mx.y),mx.z));
  }
  float densityAt(vec3 p) {
    if(any(lessThan(p,vec3(-.499)))||any(greaterThan(p,vec3(.499)))) return 0.0;
    vec3 drift=vec3(sin(uTime*.045+p.y*11.0),0.0,cos(uTime*.035+p.y*8.0))*.003;
    float d=texture(uDensity,p+0.5+drift).r;
    // A soft inspection window in the near half, with the exterior intact elsewhere.
    float window=(1.0-smoothstep(.09,.25,length((p.xy-uHail.xy)*vec2(1.0,.72))))*smoothstep(-.06,.10,p.z);
    return d*mix(1.0,1.0-window*.92,uStudy);
  }
  float lightAt(vec3 p) {
    float optical=0.0;
    vec3 delta=sun/scale*.58;
    for(int j=0;j<10;j++) {
      if(j>=uLightSteps) break;
      p+=delta;
      optical+=densityAt(p)*.58;
      delta*=1.18;
    }
    return exp(-optical*1.65);
  }
  void main() {
    vec3 ro=uCamera,rd=normalize(vLocal-ro);
    vec2 hit=boxHit(ro,rd);
    if(hit.x>hit.y) discard;
    float begin=max(hit.x,0.0),stepSize=(hit.y-begin)/float(uSteps);
    // Fixed pixel jitter avoids shimmering while paused or while taking screenshots.
    float jitter=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
    float t=begin+stepSize*jitter;
    float distanceStep=length(rd*scale)*stepSize;
    vec3 color=vec3(0.0);
    float transmittance=1.0;
    float phase=pow(max(dot(normalize(rd*scale),sun),0.0),6.0)*.22;
    for(int i=0;i<160;i++) {
      if(i>=uSteps || transmittance<.012) break;
      vec3 p=ro+rd*t;
      float d=densityAt(p);
      if(d>.015) {
        float lighting=lightAt(p);
        float powder=1.0-exp(-d*2.0);
        vec3 ambient=mix(vec3(.075,.105,.15),vec3(.18,.23,.29),clamp(p.y+.5,0.0,1.0));
        vec3 lit=ambient+vec3(.90,.94,1.0)*lighting*(.67+powder*.40+phase);
        lit*=mix(.52,1.0,smoothstep(-.48,.24,p.y));
        lit+=vec3(.36,.48,.8)*uFlash*exp(-length((p-vec3(.02,-.28,0.0))*scale)*.45);
        float alpha=1.0-exp(-d*distanceStep*1.9);
        color+=transmittance*alpha*lit;
        transmittance*=1.0-alpha;
      }
      t+=stepSize;
    }
    float alpha=1.0-transmittance;
    if(alpha<.005) discard;
    outColor=vec4(color/max(alpha,.001),alpha);
  }
`;
