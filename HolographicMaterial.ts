import * as THREE from 'three'

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uGlitchIntensity;
  uniform float uGlowPower;

  varying vec3 vNormal;
  varying vec3 vModelPosition;
  varying vec3 vViewPosition;
  varying float vFresnel;

  // Simple pseudo-random for glitch jitter
  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec3 pos = position;

    // Glitch jitter: displace vertices along normal when glitch is active
    if (uGlitchIntensity > 0.001) {
      float jitter = rand(vec2(position.x + uTime * 0.1, position.y + uTime * 0.2));
      jitter = (jitter - 0.5) * 2.0; // bipolar
      pos += normal * jitter * uGlitchIntensity * 0.3;
    }

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vNormal = normalize(normalMatrix * normal);
    vModelPosition = modelPosition.xyz;
    vViewPosition = -viewPosition.xyz;

    // Fresnel rim glow
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vec3 worldView = normalize(cameraPosition - modelPosition.xyz);
    float fresnel = pow(1.0 - max(dot(worldNormal, worldView), 0.0), 3.0);
    vFresnel = fresnel * uGlowPower;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uEmissiveColor;
  uniform float uGlitchIntensity;
  uniform float uGlowPower;

  varying vec3 vNormal;
  varying vec3 vModelPosition;
  varying vec3 vViewPosition;
  varying float vFresnel;

  void main() {
    vec3 baseColor = vec3(0.02, 0.02, 0.04);
    vec3 emissive = uEmissiveColor;

    // Horizontal scanning lines
    float scanLineFreq = 40.0;
    float scanLineSpeed = 2.0;
    float scanLine = sin(vModelPosition.y * scanLineFreq - uTime * scanLineSpeed);
    scanLine = smoothstep(0.0, 0.15, scanLine) * 0.5 + 0.5;

    // Fresnel rim contribution
    vec3 rimColor = emissive * vFresnel;

    // Scan line glow contribution
    vec3 scanColor = emissive * scanLine * 0.15 * uGlowPower;

    // Glitch chromatic banding
    float glitchBand = 0.0;
    if (uGlitchIntensity > 0.001) {
      glitchBand = step(0.92, fract(vModelPosition.y * 8.0 + uTime * 3.0)) * uGlitchIntensity;
    }

    vec3 finalColor = baseColor + rimColor + scanColor;
    finalColor += emissive * glitchBand * 0.5;

    // Alpha based on fresnel for holographic fade
    float alpha = 0.85 + vFresnel * 0.15;

    gl_FragColor = vec4(finalColor, alpha);
  }
`

export interface HolographicMaterialUniforms {
  uTime: { value: number }
  uEmissiveColor: { value: THREE.Color }
  uGlitchIntensity: { value: number }
  uGlowPower: { value: number }
}

export function createHolographicMaterial(
  emissiveColor: THREE.Color = new THREE.Color('#00ffff'),
  glitchIntensity: number = 0.0,
  glowPower: number = 1.0,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
      uEmissiveColor: { value: emissiveColor },
      uGlitchIntensity: { value: glitchIntensity },
      uGlowPower: { value: glowPower },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}
