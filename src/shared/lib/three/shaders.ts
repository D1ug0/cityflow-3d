import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three';
export function glowMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color('#8fffe0') },
      uIntensity: { value: 1 },
    },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uIntensity; varying vec2 vUv;
      void main(){vec2 p=abs(vUv-0.5)*2.0; float edge=max(p.x,p.y); float ring=smoothstep(0.56,0.80,edge)*(1.0-smoothstep(0.80,1.0,edge)); float pulse=0.65+0.35*sin(uTime*3.0); gl_FragColor=vec4(uColor,ring*pulse*uIntensity);}`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
}
export function flowMaterial() {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDensity: { value: 0.1 } },
    vertexShader: `attribute float distanceAlong; varying float vDistance; void main(){vDistance=distanceAlong;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform float uTime; uniform float uDensity; varying float vDistance;
      void main(){float wave=pow(0.5+0.5*cos(vDistance*0.14-uTime*3.0),8.0);vec3 green=vec3(0.15,0.82,0.64);vec3 amber=vec3(1.0,0.65,0.23);vec3 red=vec3(0.98,0.27,0.21); vec3 color=uDensity<0.5?mix(green,amber,uDensity*2.0):mix(amber,red,(uDensity-0.5)*2.0);gl_FragColor=vec4(color,0.18+wave*0.52);}`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
}
export function rainMaterial() {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDpr: { value: 1 } },
    vertexShader: `uniform float uTime;uniform float uDpr;attribute float phase;varying float vFade;void main(){vec3 p=position;p.z=mod(p.z-uTime*(65.0+phase*30.0),350.0);p.x+=p.z*0.13;vFade=0.3+phase*0.45;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);gl_PointSize=3.0*uDpr;}`,
    fragmentShader: `varying float vFade;void main(){float a=(1.0-smoothstep(0.12,0.48,abs(gl_PointCoord.x-0.5)))*(1.0-gl_PointCoord.y);gl_FragColor=vec4(0.65,0.8,0.92,a*vFade);}`,
    transparent: true,
    depthWrite: false,
  });
}
