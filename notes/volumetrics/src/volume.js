// ---------- 3D: a cloud you can shine a laser into ----------
// Hand-written WebGL2; the page loads no libraries. The cloud is a heap of soft blobs whose surface billows and
// erodes with Perlin–Worley noise, the way Horizon Zero Dawn's clouds are built (Schneider, "The real-time
// volumetric cloudscapes of Horizon Zero Dawn", SIGGRAPH 2015). It is baked once on the GPU into a 128³ texture,
// and a tiling 32³ Worley texture eats at its edges while rendering. Sunlight through the cloud is baked into a
// second volume (the density integrated toward the sun), scattered with a Henyey–Greenstein phase function and
// Wrenninge's octaves for multiple scattering (Production Volume Rendering, SIGGRAPH 2017), plus sky light.
// The laser is a narrow Gaussian beam: what it loses along its axis comes from the same density, integrated on
// the CPU, and what it scatters toward the camera is integrated across the beam in closed form, so a hair-thin
// beam stays smooth at any step size. With the camera still, frames are averaged and the march's noise settles.
const V3 = { N: 128, ND: 32, BEAM: 512 };
const toLin = (h) => hexRgb(h).map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
// The cumulus: soft blobs [x, y, z, r] in the cloud's box [-1, 1]³, y up. A wide base, puffs piled on top.
const V3_BLOBS = [
  [0, -0.12, 0, 0.42], [-0.38, -0.22, 0.08, 0.32], [0.4, -0.2, -0.05, 0.33], [0.1, -0.24, 0.36, 0.3], [-0.12, -0.24, -0.36, 0.3],
  [0.62, -0.3, 0.2, 0.22], [-0.62, -0.3, -0.12, 0.22], [0.16, 0.16, -0.08, 0.34], [-0.2, 0.12, 0.14, 0.3], [0.02, 0.4, 0.04, 0.26],
  [0.36, 0.08, 0.22, 0.24], [-0.38, 0.06, -0.2, 0.22], [0.22, 0.36, -0.2, 0.18], [-0.14, 0.42, 0.22, 0.17],
];

const V3_GLSL_NOISE = `
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}
float gdot(vec3 i, vec3 f, vec3 o) { return dot(hash33(i + o) * 2.0 - 1.0, f - o); }
float gnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(mix(gdot(i, f, vec3(0, 0, 0)), gdot(i, f, vec3(1, 0, 0)), u.x), mix(gdot(i, f, vec3(0, 1, 0)), gdot(i, f, vec3(1, 1, 0)), u.x), u.y),
             mix(mix(gdot(i, f, vec3(0, 0, 1)), gdot(i, f, vec3(1, 0, 1)), u.x), mix(gdot(i, f, vec3(0, 1, 1)), gdot(i, f, vec3(1, 1, 1)), u.x), u.y), u.z);
}
// distance to the nearest feature point; with a period, the cells wrap, so the noise tiles
float worley(vec3 p, float period) {
  vec3 i = floor(p), f = fract(p); float d = 1e9;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(x, y, z), c = i + o;
    if (period > 0.0) c = mod(c, period);
    vec3 r = o + hash33(c) - f; d = min(d, dot(r, r));
  }
  return sqrt(d);
}
float fbmPerlin(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * gnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float fbmWorley(vec3 p, float period) { return 0.625 * (1.0 - worley(p, period)) + 0.25 * (1.0 - worley(p * 2.0, period * 2.0)) + 0.125 * (1.0 - worley(p * 4.0, period * 4.0)); }
`;
const V3_GLSL_HEAD = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;
precision highp sampler2D;
`;
const V3_GLSL_BOX = `
vec2 boxHit(vec3 ro, vec3 rd, vec3 lo, vec3 hi) {
  vec3 r = mix(rd, vec3(1e-6), lessThan(abs(rd), vec3(1e-6)));
  vec3 inv = 1.0 / r, t0 = (lo - ro) * inv, t1 = (hi - ro) * inv, tn = min(t0, t1), tf = max(t0, t1);
  return vec2(max(max(tn.x, tn.y), tn.z), min(min(tf.x, tf.y), tf.z));
}
`;
// The cloud's density, one slice of the volume per draw.
const V3_FS_DENSITY = V3_GLSL_HEAD + V3_GLSL_NOISE + `
uniform float uZ, uN, uBillow, uErode, uBottom;
uniform vec4 uBlobs[14];
uniform vec3 uSeed;
out vec4 o;
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
void main() {
  vec3 p = vec3(gl_FragCoord.xy / uN, uZ) * 2.0 - 1.0;
  float d = 1e3;
  for (int i = 0; i < 14; i++) d = smin(d, length((p - uBlobs[i].xyz) * vec3(1.0, 1.12, 1.0)) - uBlobs[i].w, 0.2);
  float pn = fbmPerlin(p * 2.3 + uSeed);
  float wl = fbmWorley(p * 3.1 + uSeed.yzx, 0.0);
  float billow = clamp(mix(pn + 0.5, wl, 0.6), 0.0, 1.0);          // Perlin–Worley: round, puffy cells
  float shell = -d + uBillow * (billow - 0.45);                      // > 0 inside; the surface pushed out where it billows
  float base = smoothstep(0.0, 0.11, shell);
  base *= smoothstep(uBottom, uBottom + 0.2, p.y + 0.05 * pn);       // flatter underneath, as cumulus are
  float er = fbmWorley(p * 6.2 + uSeed.zxy, 0.0);
  float cut = uErode * (1.0 - er);
  o = vec4(clamp((base - cut) / max(1e-3, 1.0 - cut), 0.0, 1.0), 0.0, 0.0, 1.0);
}`;
// Fine detail that tiles: Worley fBm over a 32³ cell.
const V3_FS_DETAIL = V3_GLSL_HEAD + V3_GLSL_NOISE + `
uniform float uZ, uN;
out vec4 o;
void main() { vec3 q = vec3(gl_FragCoord.xy / uN, uZ); o = vec4(fbmWorley(q * 4.0, 4.0), 0.0, 0.0, 1.0); }`;
// For every voxel, the density integrated toward the sun: its transmittance is exp(-σt · this).
const V3_FS_LIGHT = V3_GLSL_HEAD + V3_GLSL_BOX + `
uniform sampler3D uDen;
uniform vec3 uSun;
uniform float uZ, uN;
out vec4 o;
void main() {
  vec3 p = vec3(gl_FragCoord.xy / uN, uZ) * 2.0 - 1.0;
  float tEnd = max(0.0, boxHit(p, uSun, vec3(-1.0), vec3(1.0)).y);
  const int S = 64; float h = tEnd / float(S), D = 0.0;
  for (int i = 0; i < S; i++) D += texture(uDen, (p + uSun * (float(i) + 0.5) * h) * 0.5 + 0.5).r;
  o = vec4(D * h, 0.0, 0.0, 1.0);
}`;
// The picture: props, the march through the cloud, the laser, the background. Writes linear radiance,
// averaged with the frames before it while nothing changes (or, uDirect, tone-mapped straight to the screen).
const V3_FS_RENDER = V3_GLSL_HEAD + V3_GLSL_BOX + `
#define PI 3.14159265
uniform vec2 uRes; uniform float uFrame, uBlend, uDirect;
uniform vec3 uCam, uFwd, uRight, uUp; uniform vec2 uTan;
uniform sampler3D uDen, uDet, uLight;
uniform sampler2D uBeam, uPrev;
uniform float uSigA, uSigS, uG, uDetail, uDetScale, uPowder;
uniform vec3 uSunDir, uSunCol, uAmbCol; uniform float uSun, uAmb;
uniform int uSteps;
uniform vec3 uB0, uBd, uBu, uBv, uLaserCol; uniform float uBLen, uBW, uBPow, uFront, uCore, uLaserOn;
uniform int uBg; uniform vec3 uBgCol, uBodyCol, uEdgeCol;
uniform float uEyeOn; uniform vec3 uEyePos, uEyeDir;
out vec4 o;

float density(vec3 p) {
  vec3 q = p * 0.5 + 0.5;
  float b = texture(uDen, q).r;
  if (b < 0.003) return 0.0;
  float dn = texture(uDet, q * uDetScale).r;
  return max(0.0, b - uDetail * (1.0 - dn) * (1.0 - b) * 1.6);
}
float hg(float mu, float g) { float g2 = g * g; return (1.0 - g2) / (4.0 * PI * pow(max(1e-4, 1.0 + g2 - 2.0 * g * mu), 1.5)); }
float phase(float mu, float g) { return mix(hg(mu, g), hg(mu, -0.25), 0.15); }
// Wrenninge's octaves: each further order of scattering sees the cloud thinner, scatters more evenly, and carries less.
vec3 sunIn(float D, float mu, float sigT, float alb) {
  float a = 1.0, b = 1.0, c = 1.0, s = 0.0;
  for (int k = 0; k < 4; k++) { s += b * exp(-sigT * a * D) * phase(mu, uG * c); a *= 0.5; b *= 0.45 * alb; c *= 0.5; }
  return uSunCol * (uSun * s);
}
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
vec3 background(vec3 rd) {
  if (uBg == 1) {        // sky
    float h = clamp(rd.y, -0.2, 1.0);
    vec3 sky = mix(vec3(0.62, 0.72, 0.86), vec3(0.16, 0.32, 0.66), pow(max(h, 0.0), 0.6));
    sky = mix(sky, vec3(0.32, 0.30, 0.28), smoothstep(0.0, -0.2, h));
    float s = max(dot(rd, uSunDir), 0.0);
    return sky + uSunCol * (pow(s, 900.0) * 30.0 + pow(s, 12.0) * 0.12) * uSun;
  }
  if (uBg == 2) return vec3(0.82, 0.8, 0.76);   // a light box behind the cloud
  return uBgCol;
}
// An oriented box: distance along the ray, the face normal and the hit in the box's own frame.
float hitBox(vec3 ro, vec3 rd, vec3 c, vec3 ax, vec3 ay, vec3 az, vec3 h, out vec3 n, out vec3 lp) {
  vec3 q = ro - c, lo = vec3(dot(q, ax), dot(q, ay), dot(q, az)), ld = vec3(dot(rd, ax), dot(rd, ay), dot(rd, az));
  ld = mix(ld, vec3(1e-6), lessThan(abs(ld), vec3(1e-6)));
  vec3 inv = 1.0 / ld, t0 = (-h - lo) * inv, t1 = (h - lo) * inv, tn = min(t0, t1), tf = max(t0, t1);
  float tN = max(max(tn.x, tn.y), tn.z), tF = min(min(tf.x, tf.y), tf.z);
  if (tN > tF || tF < 0.0 || tN < 0.0) return 1e9;
  lp = lo + ld * tN;
  vec3 f = step(tn.yzx, tn) * step(tn.zxy, tn) * -sign(ld);
  n = ax * f.x + ay * f.y + az * f.z;
  return tN;
}
// Flat shading with a key light and an outline along the edges, as the 2D scenes draw their devices.
vec3 shadeBox(vec3 n, vec3 lp, vec3 h, float ew) {
  vec3 m = h - abs(lp);
  float lo = min(min(m.x, m.y), m.z), hi = max(max(m.x, m.y), m.z), mid = m.x + m.y + m.z - lo - hi;
  vec3 c = uBodyCol * (0.55 + 0.45 * max(dot(n, normalize(vec3(0.3, 0.8, 0.5))), 0.0));
  return mix(c, uEdgeCol, smoothstep(ew, ew * 0.4, mid));
}
float sat(float x) { return clamp(x, 0.0, 1.0); }
void main() {
  float fr = uFrame;
  vec2 jit = uBlend < 1.0 ? vec2(fract(fr * 0.754877669), fract(fr * 0.569840291)) - 0.5 : vec2(0.0);
  vec2 ndc = ((gl_FragCoord.xy + jit) / uRes) * 2.0 - 1.0;
  vec3 ro = uCam, rd = normalize(uFwd + ndc.x * uTan.x * uRight + ndc.y * uTan.y * uUp);
  float pix = 2.0 * uTan.y / uRes.y;   // radians per pixel

  // ---- props: the laser, its nozzle, the sensor ----
  float tP = 1e9; vec3 pc = vec3(0.0), n, lp;
  if (uLaserOn > 0.0) {
    vec3 hb = vec3(0.3, 0.085, 0.085), cb = uB0 - uBd * 0.33;
    float t = hitBox(ro, rd, cb, uBd, uBu, uBv, hb, n, lp);
    if (t < tP) {
      tP = t; pc = shadeBox(n, lp, hb, 0.012);
      float dotr = length(lp.xz - vec2(-0.13, -0.035));
      if (dot(n, uBu) > 0.5 && dotr < 0.02) pc = mix(uLaserCol * 2.0, pc, smoothstep(0.016, 0.02, dotr));
    }
    vec3 hn = vec3(0.03, 0.04, 0.04);
    t = hitBox(ro, rd, uB0 - uBd * 0.03, uBd, uBu, uBv, hn, n, lp);
    if (t < tP) { tP = t; pc = shadeBox(n, lp, hn, 0.008) * 0.6; }
    vec3 hs = vec3(0.012, 0.17, 0.17);
    t = hitBox(ro, rd, uB0 + uBd * (uBLen + 0.012), uBd, uBu, uBv, hs, n, lp);
    if (t < tP) {
      tP = t; pc = shadeBox(n, lp, hs, 0.01);
      if (dot(n, uBd) < -0.5 && uFront > 0.999) {   // where the beam lands on the plate
        float tb = texture(uBeam, vec2(1.0, 0.5)).r;
        float r2 = dot(lp.yz, lp.yz);
        pc += uLaserCol * uBPow * exp(-(uSigA + uSigS) * tb) * exp(-r2 / (2.0 * uBW * uBW * 4.0)) * 3.0;
      }
    }
  }
  if (uEyeOn > 0.0) {   // an eye: white, with an iris and a pupil looking along uEyeDir
    vec3 q = ro - uEyePos; float b = dot(q, rd), c = dot(q, q) - 0.0144, h = b * b - c;
    if (h > 0.0) {
      float t = -b - sqrt(h);
      if (t > 0.0 && t < tP) {
        tP = t; vec3 nn = normalize(q + rd * t); float k = dot(nn, uEyeDir);
        vec3 col = vec3(0.86, 0.84, 0.8) * (0.6 + 0.4 * max(dot(nn, normalize(vec3(0.3, 0.8, 0.5))), 0.0));
        col = mix(col, vec3(0.16, 0.36, 0.62), smoothstep(0.80, 0.83, k));
        col = mix(col, vec3(0.01), smoothstep(0.93, 0.95, k));
        pc = mix(col * uEyeOn, pc, 0.0);
      }
    }
  }

  // ---- the march through the cloud ----
  vec2 tb = boxHit(ro, rd, vec3(-1.0), vec3(1.0));
  float t0 = max(tb.x, 0.0), t1 = min(tb.y, tP);
  // the closest approach of this ray to the laser's axis, for the light the beam scatters toward us
  float bb = dot(rd, uBd), den = max(1e-5, 1.0 - bb * bb);
  vec3 w0 = ro - uB0; float d0 = dot(rd, w0), e0 = dot(uBd, w0);
  float sMax = uBLen * uFront, sb = clamp((e0 - bb * d0) / den, 0.0, sMax);
  float tv = max(dot(uB0 + uBd * sb - ro, rd), 0.0);
  float dist = length(ro + rd * tv - (uB0 + uBd * sb));
  float Tstar = 1.0; bool got = tv < t0;
  vec3 L = vec3(0.0); float T = 1.0;
  float sigT0 = uSigA + uSigS, alb = sigT0 > 0.0 ? uSigS / sigT0 : 0.0, mu = dot(rd, uSunDir);
  if (t1 > t0 && sigT0 > 0.0) {
    float len = t1 - t0, dt = 3.4641 / float(uSteps);
    float t = t0 + dt * fract(ign(gl_FragCoord.xy) + fr * 0.618034);
    for (int i = 0; i < 400; i++) {
      if (t > t1 || T < 0.003 || i >= uSteps * 2) break;
      vec3 p = ro + rd * t;
      float rho = density(p);
      if (rho > 0.0) {
        float st = sigT0 * rho, Tr = exp(-st * dt);
        if (uSigS > 0.0) {
          float D = texture(uLight, p * 0.5 + 0.5).r;
          float hf = sat((p.y + 0.55) / 1.3);
          float powder = mix(1.0, 1.0 - exp(-2.0 * st), uPowder * (0.5 - 0.5 * mu));
          vec3 Lin = sunIn(D, mu, sigT0, alb) * powder + uAmbCol * uAmb * (0.3 + 0.7 * hf) * mix(1.0, alb, 0.5);
          L += T * (uSigS * rho) * Lin * (1.0 - Tr) / st;
        }
        if (!got && t + dt > tv) { Tstar = T * exp(-st * max(0.0, tv - t)); got = true; }
        T *= Tr;
      } else if (!got && t + dt > tv) { Tstar = T; got = true; }
      t += dt;
    }
    if (!got) Tstar = T;
  }

  // ---- the laser: scattered toward us where it crosses the cloud, and its core ----
  if (uLaserOn > 0.0 && uFront > 0.0 && tv < tP) {
    vec3 pb = uB0 + uBd * sb;
    float Db = texture(uBeam, vec2(sb / max(uBLen, 1e-3), 0.5)).r;
    float Tb = exp(-sigT0 * Db), sinA = max(sqrt(den), 0.035), w = uBW;
    // the beam's own light scattered toward us (density on its axis), and a wider glow of light scattered more
    // than once around it (density where we see it, so the glow stays inside the cloud)
    float rhoB = density(pb), rhoV = density(ro + rd * tv);
    if (uSigS > 0.0 && rhoB + rhoV > 0.0) {
      float g1 = exp(-dist * dist / (2.0 * w * w)) / (2.5066 * w * sinA);
      float W = w * 7.0, g2 = exp(-dist * dist / (2.0 * W * W)) / (2.5066 * W * sinA);
      L += uLaserCol * uBPow * Tb * Tstar * uSigS * (rhoB * phase(dot(uBd, -rd), uG) * g1 + rhoV * alb * 0.2 * g2) * 0.25;
    }
    if (uCore > 0.0) {
      float wc = max(w * 0.7, tv * pix * 0.8);
      L += uCore * uLaserCol * uBPow * Tb * Tstar * exp(-dist * dist / (2.0 * wc * wc)) * 1.2;
    }
  }

  vec3 back = tP < 1e8 ? pc : background(rd);
  vec3 col = L + T * back;
  if (uDirect > 0.5) {
    vec3 k = vec3(0.6), x = max(col - k, 0.0);
    col = min(col, k) + (1.0 - k) * (1.0 - exp(-x / (1.0 - k)));
    o = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
    return;
  }
  vec3 prev = texture(uPrev, gl_FragCoord.xy / uRes).rgb;
  o = vec4(mix(prev, col, uBlend), 1.0);
}`;
// Linear radiance to the screen: a soft knee above 0.6, then sRGB.
const V3_FS_SHOW = V3_GLSL_HEAD + `
uniform sampler2D uTex; uniform vec2 uRes;
out vec4 o;
vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec3 col = max(texture(uTex, gl_FragCoord.xy / uRes).rgb, 0.0);
  vec3 k = vec3(0.6), x = max(col - k, 0.0);
  col = min(col, k) + (1.0 - k) * (1.0 - exp(-x / (1.0 - k)));
  o = vec4(srgb(col), 1.0);
}`;

// ---------- the renderer ----------
let G3 = null;   // made the first time a 3D scene draws; false if WebGL2 is not there
function g3() {
  if (G3 !== null) return G3 || null;
  G3 = false;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const R = { gl, canvas, float: !!gl.getExtension('EXT_color_buffer_float'), shapeKey: '', lightKey: '', beamKey: '', sig: '', frames: 0, acc: [], w: 0, h: 0, err: null };
  try {
    const prog = (fs) => {
      const vs = '#version 300 es\nvoid main() { gl_Position = vec4(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0, 0.0, 1.0); }';
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, a.name); }
      return { p, u };
    };
    R.pDen = prog(V3_FS_DENSITY); R.pDet = prog(V3_FS_DETAIL); R.pLight = prog(V3_FS_LIGHT); R.pRender = prog(V3_FS_RENDER); R.pShow = prog(V3_FS_SHOW);
  } catch (err) { console.error(err); R.err = String(err.message || err); G3 = R; return R; }
  gl.bindVertexArray(gl.createVertexArray());
  const tex3 = (n, fmt, wrap) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_3D, t);
    gl.texStorage3D(gl.TEXTURE_3D, 1, fmt, n, n, n);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R]) gl.texParameteri(gl.TEXTURE_3D, p, wrap);
    return t;
  };
  R.den = tex3(V3.N, gl.R8, gl.CLAMP_TO_EDGE); R.det = tex3(V3.ND, gl.R8, gl.REPEAT); R.light = tex3(V3.N, R.float ? gl.R16F : gl.R8, gl.CLAMP_TO_EDGE);
  R.beam = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, R.beam);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  R.fb = gl.createFramebuffer();
  G3 = R;
  return R;
}
// Fill a 3D texture slice by slice with a program.
function g3bake(R, prog, tex, n, set) {
  const gl = R.gl;
  gl.useProgram(prog.p); gl.bindFramebuffer(gl.FRAMEBUFFER, R.fb); gl.viewport(0, 0, n, n);
  set(prog.u);
  gl.uniform1f(prog.u.uN, n);
  for (let z = 0; z < n; z++) {
    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tex, 0, z);
    gl.uniform1f(prog.u.uZ, (z + 0.5) / n);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
// Read a baked R8 volume back, so the CPU can follow the beam through the same cloud.
function g3read(R, tex, n) {
  const gl = R.gl, out = new Uint8Array(n * n * n), px = new Uint8Array(n * n * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, R.fb);
  for (let z = 0; z < n; z++) {
    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tex, 0, z);
    gl.readPixels(0, 0, n, n, gl.RGBA, gl.UNSIGNED_BYTE, px);
    for (let i = 0; i < n * n; i++) out[z * n * n + i] = px[i * 4];
  }
  return out;
}
function g3shape(R, st) {
  const key = `${st.seed}|${st.billow}|${st.erode}`;
  if (R.shapeKey === key) return;
  const gl = R.gl, rnd = rng32(st.seed * 977 + 5);
  const seed = [rnd() * 40, rnd() * 40, rnd() * 40];
  if (!R.detDone) { g3bake(R, R.pDet, R.det, V3.ND, () => {}); R.detCpu = g3read(R, R.det, V3.ND); R.detDone = true; }
  g3bake(R, R.pDen, R.den, V3.N, (u) => {
    gl.uniform4fv(u.uBlobs, new Float32Array(V3_BLOBS.flat()));
    gl.uniform3fv(u.uSeed, seed); gl.uniform1f(u.uBillow, st.billow); gl.uniform1f(u.uErode, st.erode); gl.uniform1f(u.uBottom, -0.5);
  });
  R.denCpu = g3read(R, R.den, V3.N);
  R.shapeKey = key; R.lightKey = ''; R.beamKey = ''; R.sig = '';
}
function g3light(R, sun) {
  const key = sun.map((v) => v.toFixed(4)).join(',') + R.shapeKey;
  if (R.lightKey === key) return;
  const gl = R.gl;
  g3bake(R, R.pLight, R.light, V3.N, (u) => {
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_3D, R.den); gl.uniform1i(u.uDen, 0);
    gl.uniform3fv(u.uSun, sun);
  });
  R.lightKey = key;
}
// The cloud's density at a point, as the shader samples it: trilinear in the base, eroded by the detail.
function g3density(R, st, x, y, z) {
  const n = V3.N, D = R.denCpu, fx = (x * 0.5 + 0.5) * n - 0.5, fy = (y * 0.5 + 0.5) * n - 0.5, fz = (z * 0.5 + 0.5) * n - 0.5;
  if (fx < -0.5 || fy < -0.5 || fz < -0.5 || fx > n - 0.5 || fy > n - 0.5 || fz > n - 0.5) return 0;
  const tri = (A, m, u, v, w, wrap) => {
    let i0 = Math.floor(u), j0 = Math.floor(v), k0 = Math.floor(w); const a = u - i0, b = v - j0, c = w - k0;
    const at = (i, j, k) => { if (wrap) { i = ((i % m) + m) % m; j = ((j % m) + m) % m; k = ((k % m) + m) % m; } else { i = clamp(i, 0, m - 1); j = clamp(j, 0, m - 1); k = clamp(k, 0, m - 1); } return A[(k * m + j) * m + i]; };
    const l = (p, q, t) => p + (q - p) * t;
    return l(l(l(at(i0, j0, k0), at(i0 + 1, j0, k0), a), l(at(i0, j0 + 1, k0), at(i0 + 1, j0 + 1, k0), a), b),
             l(l(at(i0, j0, k0 + 1), at(i0 + 1, j0, k0 + 1), a), l(at(i0, j0 + 1, k0 + 1), at(i0 + 1, j0 + 1, k0 + 1), a), b), c) / 255;
  };
  const b = tri(D, n, fx, fy, fz, false); if (b < 0.003) return 0;
  const m = V3.ND, s = st.detScale, qx = (x * 0.5 + 0.5) * s * m - 0.5, qy = (y * 0.5 + 0.5) * s * m - 0.5, qz = (z * 0.5 + 0.5) * s * m - 0.5;
  const dn = tri(R.detCpu, m, qx, qy, qz, true);
  return Math.max(0, b - st.detail * (1 - dn) * (1 - b) * 1.6);
}

// ---------- small vector helpers ----------
const vAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vMul = (a, s) => [a[0] * s, a[1] * s, a[2] * s], vDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vCross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vNorm = (a) => vMul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

// The orbit camera, and where a point lands on the stage.
function v3cam(st, target = [0, 0.02, 0]) {
  const cp = Math.cos(st.pitch), pos = [target[0] + st.dist * cp * Math.sin(st.yaw), target[1] + st.dist * Math.sin(st.pitch), target[2] + st.dist * cp * Math.cos(st.yaw)];
  const f = vNorm(vSub(target, pos)), r = vNorm(vCross(f, [0, 1, 0])), u = vCross(r, f);
  const ty = Math.tan((st.fov * Math.PI) / 360), tx = ty * (W / H);
  const project = (p) => { const v = vSub(p, pos), z = vDot(v, f); if (z <= 1e-3) return null; return [W / 2 + (vDot(v, r) / (z * tx)) * (W / 2), H / 2 - (vDot(v, u) / (z * ty)) * (H / 2), z]; };
  return { pos, f, r, u, tx, ty, project };
}
// The laser: it aims through (0, beamY, beamZ), starts 1.65 before it and ends at the sensor 1.65 after it.
function v3beam(st) {
  const yaw = (st.aim * Math.PI) / 180, pit = (st.aimUp * Math.PI) / 180;
  const d = [Math.cos(pit) * Math.cos(yaw), Math.sin(pit), Math.cos(pit) * Math.sin(yaw)], mid = [0, st.beamY, st.beamZ];
  const v = vNorm(vCross(d, [0, 1, 0])), u = vCross(v, d), len = 3.3;
  return { d, u, v, len, b0: vSub(mid, vMul(d, len / 2)) };
}
// The density integrated along the beam from its start, as a table the shader reads; its end gives the sensor.
function g3beamTable(R, st, B) {
  const key = [R.shapeKey, st.detail, st.detScale, ...B.b0, ...B.d].map((v) => (typeof v === 'number' ? v.toFixed(4) : v)).join('|');
  if (R.beamKey === key) return;
  const n = V3.BEAM, steps = 2048, ds = B.len / steps, cum = new Float32Array(steps + 1);
  for (let i = 0; i < steps; i++) { const s = (i + 0.5) * ds, p = vAdd(B.b0, vMul(B.d, s)); cum[i + 1] = cum[i] + g3density(R, st, p[0], p[1], p[2]) * ds; }
  const tab = new Float32Array(n);
  for (let i = 0; i < n; i++) tab[i] = cum[Math.round((i / (n - 1)) * steps)];
  const gl = R.gl; gl.bindTexture(gl.TEXTURE_2D, R.beam); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, n, 1, 0, gl.RED, gl.FLOAT, tab);
  R.beamD = tab[n - 1]; R.beamKey = key;
}
function g3targets(R, w, h) {
  if (R.w === w && R.h === h) return;
  const gl = R.gl; R.canvas.width = w; R.canvas.height = h; R.w = w; R.h = h; R.sig = '';
  for (const a of R.acc) { gl.deleteTexture(a.t); gl.deleteFramebuffer(a.f); }
  R.acc = [];
  if (!R.float) return;
  for (let i = 0; i < 2; i++) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    R.acc.push({ t, f });
  }
  R.ping = 0;
}
const V3_QUALITY = { low: [0.55, 64], medium: [0.9, 100], high: [1.4, 160] };
// Draw the cloud with the scene's settings into the renderer's canvas. Frames are averaged while nothing changes.
function g3render(R, st, cam, B, extra = {}) {
  const gl = R.gl, [qs, steps] = V3_QUALITY[st.quality] || V3_QUALITY.medium;
  const w = Math.max(96, Math.round(Math.min(2048, (cssW || 960) * qs))), h = Math.max(54, Math.round((w * H) / W));
  g3targets(R, w, h);
  const el = (st.sunEl * Math.PI) / 180, az = (st.sunAz * Math.PI) / 180, sun = [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)];
  g3shape(R, st); g3light(R, sun); g3beamTable(R, st, B);
  const sigA = st.sigA * st.absorb * st.dens, sigS = st.sigS * st.scatter * st.dens, lc = toLin(SH.color), eye = extra.eye || null;
  const sig = JSON.stringify([w, h, steps, cam.pos, cam.f, st.fov, sun, sigA, sigS, st.g, st.powder, st.sun, st.sunI, st.amb, st.detail, st.detScale, st.bg, B.b0, B.d, st.bw, st.bpow * SH.I0, st.front, st.core, st.laser, lc, eye, R.shapeKey]);
  if (sig !== R.sig) { R.sig = sig; R.frames = 0; }
  const accum = R.float && R.acc.length && st.accum > 0.5, blend = accum ? 1 / (R.frames + 1) : 1;
  if (accum && R.frames >= 160) { g3show(R); return; }   // settled: just show it
  const P = R.pRender, u = P.u;
  gl.useProgram(P.p);
  const tgt = accum ? R.acc[1 - R.ping] : null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, tgt ? tgt.f : null); gl.viewport(0, 0, w, h);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_3D, R.den); gl.uniform1i(u.uDen, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_3D, R.det); gl.uniform1i(u.uDet, 1);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_3D, R.light); gl.uniform1i(u.uLight, 2);
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, R.beam); gl.uniform1i(u.uBeam, 3);
  gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, accum ? R.acc[R.ping].t : null); gl.uniform1i(u.uPrev, 4);
  gl.uniform2f(u.uRes, w, h); gl.uniform1f(u.uFrame, R.frames); gl.uniform1f(u.uBlend, blend); gl.uniform1f(u.uDirect, accum ? 0 : 1);
  gl.uniform3fv(u.uCam, cam.pos); gl.uniform3fv(u.uFwd, cam.f); gl.uniform3fv(u.uRight, cam.r); gl.uniform3fv(u.uUp, cam.u); gl.uniform2f(u.uTan, cam.tx, cam.ty);
  gl.uniform1f(u.uSigA, sigA); gl.uniform1f(u.uSigS, sigS); gl.uniform1f(u.uG, st.g); gl.uniform1f(u.uDetail, st.detail); gl.uniform1f(u.uDetScale, st.detScale); gl.uniform1f(u.uPowder, st.powder);
  gl.uniform3fv(u.uSunDir, sun); gl.uniform3fv(u.uSunCol, [1, 0.94, 0.86]); gl.uniform3fv(u.uAmbCol, st.bg === 'sky' ? [0.45, 0.58, 0.8] : [0.62, 0.6, 0.58]);
  gl.uniform1f(u.uSun, st.sun * st.sunI); gl.uniform1f(u.uAmb, st.amb); gl.uniform1i(u.uSteps, steps);
  gl.uniform3fv(u.uB0, B.b0); gl.uniform3fv(u.uBd, B.d); gl.uniform3fv(u.uBu, B.u); gl.uniform3fv(u.uBv, B.v); gl.uniform3fv(u.uLaserCol, lc);
  gl.uniform1f(u.uBLen, B.len); gl.uniform1f(u.uBW, st.bw); gl.uniform1f(u.uBPow, st.bpow * SH.I0); gl.uniform1f(u.uFront, st.front); gl.uniform1f(u.uCore, st.core); gl.uniform1f(u.uLaserOn, st.laser);
  gl.uniform1i(u.uBg, st.bg === 'sky' ? 1 : st.bg === 'light' ? 2 : 0); gl.uniform3fv(u.uBgCol, toLin(BG)); gl.uniform3fv(u.uBodyCol, toLin(BODY)); gl.uniform3fv(u.uEdgeCol, toLin(COL.greyB));
  gl.uniform1f(u.uEyeOn, eye ? 1 : 0); gl.uniform3fv(u.uEyePos, eye ? eye.pos : [0, 0, 0]); gl.uniform3fv(u.uEyeDir, eye ? eye.dir : [1, 0, 0]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  if (accum) { R.ping = 1 - R.ping; R.frames++; g3show(R); }
}
function g3show(R) {
  const gl = R.gl, P = R.pShow;
  gl.useProgram(P.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, R.w, R.h);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, R.acc[R.ping].t); gl.uniform1i(P.u.uTex, 0); gl.uniform2f(P.u.uRes, R.w, R.h);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ---------- K. a cloud in 3D ----------
// Drag to orbit, scroll to come closer. Turn scattering and absorption on and off: with absorption alone the cloud
// is a dark smoke that only dims what is behind it, and the beam cannot be seen from the side at all, only where it
// lands; with scattering, sunlight and the beam light the cloud up. Either way the sensor reads less, because both
// take light out of the beam: T = e^{−(σa + σs) ∫ρ ds}.
const SK = defScene({
  id: 'cloud', tab: 'Cloud in 3D', shared: true,
  defaults: () => ({ yaw: 0.62, pitch: 0.16, dist: 4.6, fov: 34,
    dens: 1, sigA: 0.8, sigS: 10, absorb: 1, scatter: 1, g: 0.55, detail: 0.55, detScale: 3, billow: 0.5, erode: 0.3, seed: 1, powder: 0.6,
    sun: 1, sunAz: -55, sunEl: 26, sunI: 24, amb: 0.22, bg: 'stage',
    laser: 1, front: 1, beamY: 0, beamZ: 0.5, aim: 0, aimUp: 0, bw: 0.012, bpow: 1, core: 1,
    quality: 'medium', accum: 1, shown: null }),
  actions: [
    { id: 'shine', label: 'Shine', primary: true, run: (st) => { untween(st, 'front'); st.front = 0; st.shown = null; return tween(st, 'front', 1, 2.4, { ease: linear }); } },
    { id: 'orbit', label: 'Orbit', run: (st) => tween(st, 'yaw', st.yaw + Math.PI * 2, 16, { ease: linear }) },
    { id: 'scatter', label: 'Scattering on / off', run: (st) => tween(st, 'scatter', st.scatter > 0.5 ? 0 : 1, 1.2) },
    { id: 'absorb', label: 'Absorption on / off', run: (st) => tween(st, 'absorb', st.absorb > 0.5 ? 0 : 1, 1.2) },
    { id: 'sun', label: 'Sun on / off', run: (st) => tween(st, 'sun', st.sun > 0.5 ? 0 : 1, 1.2) },
    { id: 'newcloud', label: 'New cloud', run: (st) => { st.seed += 1; } },
    RESET,
  ],
  params: [
    { type: 'select', key: 'quality', label: 'Quality', options: [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']] },
    { type: 'select', key: 'bg', label: 'Background', options: [['stage', 'Stage'], ['sky', 'Sky'], ['light', 'Light box']] },
    { type: 'check', key: 'absorb', label: 'Absorption', set: (v) => tween(SK, 'absorb', v ? 1 : 0, 1) },
    { type: 'check', key: 'scatter', label: 'Scattering', set: (v) => tween(SK, 'scatter', v ? 1 : 0, 1) },
    { type: 'check', key: 'sun', label: 'Sun', set: (v) => tween(SK, 'sun', v ? 1 : 0, 1) },
    { type: 'check', key: 'laser', label: 'Laser', set: (v) => tween(SK, 'laser', v ? 1 : 0, 0.4) },
    { type: 'check', key: 'core', label: 'Beam core (seen without scattering)', set: (v) => tween(SK, 'core', v ? 1 : 0, 0.6) },
    { type: 'check', key: 'accum', label: 'Refine while still', set: (v) => { SK.accum = v ? 1 : 0; } },
    { type: 'range', key: 'dens', label: 'Density', min: 0, max: 3, step: 0.01, fmt: (v) => `${v.toFixed(2)}×` },
    { type: 'range', key: 'sigA', label: 'Absorption σₐ', min: 0, max: 20, step: 0.05, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'sigS', label: 'Scattering σₛ', min: 0, max: 30, step: 0.05, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'g', label: 'Anisotropy g', min: -0.9, max: 0.95, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'sunAz', label: 'Sun azimuth (°)', min: -180, max: 180, step: 1, fmt: (v) => String(v) },
    { type: 'range', key: 'sunEl', label: 'Sun elevation (°)', min: -10, max: 89, step: 1, fmt: (v) => String(v) },
    { type: 'range', key: 'sunI', label: 'Sun strength', min: 0, max: 80, step: 0.5, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'amb', label: 'Sky light', min: 0, max: 2, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'beamY', label: 'Beam height', min: -0.6, max: 0.7, step: 0.005, fmt: (v) => v.toFixed(3) },
    { type: 'range', key: 'beamZ', label: 'Beam depth', min: -0.8, max: 0.8, step: 0.005, fmt: (v) => v.toFixed(3) },
    { type: 'range', key: 'aim', label: 'Beam aim (°)', min: -40, max: 40, step: 0.5, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'bw', label: 'Beam width', min: 0.003, max: 0.06, step: 0.001, fmt: (v) => v.toFixed(3) },
    { type: 'range', key: 'bpow', label: 'Beam power', min: 0, max: 4, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'detail', label: 'Edge detail', min: 0, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'powder', label: 'Dark edges (powder)', min: 0, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'billow', label: 'Billow (new shape)', min: 0, max: 0.8, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'erode', label: 'Erosion (new shape)', min: 0, max: 0.8, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'fov', label: 'Field of view (°)', min: 15, max: 70, step: 1, fmt: (v) => String(v) },
    { type: 'note', html: 'Drag to orbit, scroll to zoom. With the camera still, frames are averaged until the picture settles.' },
  ],
  draw: drawCloud3D, pointer: pointerCloud3D, wheel: (dy) => { SK.dist = clamp(SK.dist * Math.exp(dy * 0.0012), 1.8, 9); },
});
function g3unavailable(ctx, R) {
  drawTex(ctx, String.raw`\text{WebGL2 is needed for the 3D scenes}`, W / 2, H / 2 - 30, 56, {});
  if (R && R.err) { ctx.save(); ctx.font = '400 22px monospace'; ctx.fillStyle = COL.grey; ctx.textAlign = 'center'; ctx.fillText(R.err.slice(0, 160), W / 2, H / 2 + 50); ctx.restore(); }
}
function drawCloud3D(ctx, dt, st) {
  const R = g3();
  if (!R || R.err) { g3unavailable(ctx, R); return; }
  const cam = v3cam(st), B = v3beam(st);
  g3render(R, st, cam, B);
  ctx.drawImage(R.canvas, 0, 0, W, H);
  // the sensor's reading: the beam's transmittance through the cloud, absorption and scattering together
  const reading = st.laser > 0.5 && st.front >= 0.999 && SH.I0 > 0 ? Math.exp(-(st.sigA * st.absorb + st.sigS * st.scatter) * st.dens * (R.beamD || 0)) : null;
  st.shown = reading == null ? null : st.shown == null || reduced ? reading : lerp(st.shown, reading, 1 - Math.exp(-dt * 6));
  if (st.shown != null) {
    const top = cam.project(vAdd(vAdd(B.b0, vMul(B.d, B.len + 0.012)), vMul(B.u, 0.2)));
    if (top) { const bw = 210, bh = 84, bx = clamp(top[0] - bw / 2, 20, W - bw - 20), by = clamp(top[1] - bh - 20, 20, H - bh - 20); readoutBox(ctx, bx, by + bh / 2, st.shown, 1); }
  }
}
function pointerCloud3D(type, x, y) {
  const st = SK, sc = scenes.cloud;
  if (type === 'down') { sc.drag = [x, y]; untween(st, 'yaw'); return true; }
  if (type === 'up') { sc.drag = null; return false; }
  if (sc.drag) { st.yaw -= (x - sc.drag[0]) * 0.0045; st.pitch = clamp(st.pitch + (y - sc.drag[1]) * 0.0035, -1.2, 1.35); sc.drag = [x, y]; return true; }
  return true;
}
