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
  uniform sampler3D uDetail;
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
  const vec3 sun = normalize(vec3(-0.72,0.48,-0.32));

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
    if(d<.02)return 0.0;
    float detail=texture(uDetail,(p*scale+vec3(uTime*.025,0.0,0.0))*.28).r;
    float fine=texture(uDetail,(p*scale+vec3(0.0,uTime*.018,0.0))*1.12).r;
    d=max(0.0,d-(1.0-d)*max(0.0,.58-detail)*.52-max(0.0,.55-fine)*.06);
    // A soft inspection window in the near half, with the exterior intact elsewhere.
    float window=(1.0-smoothstep(.09,.25,length((p.xy-uHail.xy)*vec2(1.0,.72))))*smoothstep(-.06,.10,p.z);
    return d*mix(1.0,1.0-window*.92,uStudy);
  }
  float lightAt(vec3 p) {
    float optical=0.0;
    vec3 delta=sun/scale*.42;
    for(int j=0;j<10;j++) {
      if(j>=uLightSteps) break;
      p+=delta;
      optical+=densityAt(p)*length(delta*scale);
      delta*=1.32;
    }
    return optical;
  }
  float hg(float cosine,float g){return (1.0-g*g)/pow(max(1.0+g*g-2.0*g*cosine,.04),1.5);}
  float surfaceLight(vec3 p){
    vec3 e=vec3(.012,.012,.016),uv=p+.5;
    vec3 gradient=vec3(
      texture(uDensity,uv-vec3(e.x,0,0)).r-texture(uDensity,uv+vec3(e.x,0,0)).r,
      texture(uDensity,uv-vec3(0,e.y,0)).r-texture(uDensity,uv+vec3(0,e.y,0)).r,
      texture(uDensity,uv-vec3(0,0,e.z)).r-texture(uDensity,uv+vec3(0,0,e.z)).r);
    vec3 normal=normalize(gradient/scale+vec3(.00001));
    return .42+.58*max(dot(normal,sun),0.0);
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
    float cosine=dot(normalize(rd*scale),sun);
    float phase=.75*hg(cosine,.52)+.25*hg(cosine,-.2);
    for(int i=0;i<160;i++) {
      if(i>=uSteps || transmittance<.012) break;
      vec3 p=ro+rd*t;
      float d=densityAt(p);
      if(d>.015) {
        float optical=lightAt(p);
        float direct=exp(-optical*1.9);
        float multiple=exp(-optical*.45)*.13+exp(-optical*.12)*.045;
        float powder=1.0-exp(-d*3.0);
        vec3 ambient=mix(vec3(.035,.06,.095),vec3(.10,.15,.23),clamp(p.y+.5,0.0,1.0));
        vec3 lit=ambient+vec3(1.12,.98,.80)*(direct*(.95+phase*.14)*surfaceLight(p)+multiple)*(.82+powder*.27);
        lit*=mix(.60,1.0,smoothstep(-.48,.24,p.y));
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
