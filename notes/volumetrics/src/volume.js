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
uniform vec2 uRes, uOff; uniform float uFrame, uBlend, uDirect;
uniform vec3 uCam, uFwd, uRight, uUp; uniform vec2 uTan;
uniform sampler3D uDen, uDet, uLight;
uniform sampler2D uBeam, uPrev;
uniform float uSigA, uSigS, uG, uDetail, uDetScale, uPowder;
uniform vec3 uSunDir, uSunCol, uAmbCol; uniform float uSun, uAmb;
uniform int uSteps;
uniform vec3 uB0, uBd, uBu, uBv, uLaserCol; uniform float uBLen, uBW, uBPow, uFront, uCore, uLaserOn;
uniform int uBg; uniform vec3 uBgCol, uBodyCol, uEdgeCol;
uniform float uEyeOn; uniform vec3 uEyePos, uEyeDir;
uniform vec3 uKeepC, uKeepH; uniform mat3 uKeepA; uniform float uKeepM;   // the zoom's box: outside it, the cloud fades by uKeepM
out vec4 o;

float density(vec3 p) {
  float keep = 1.0;
  if (uKeepM > 0.0) {
    vec3 l = abs((p - uKeepC) * uKeepA) - uKeepH;
    keep = mix(1.0, 1.0 - smoothstep(-0.012, 0.004, max(max(l.x, l.y), l.z)), uKeepM);
    if (keep <= 0.0) return 0.0;
  }
  vec3 q = p * 0.5 + 0.5;
  float b = texture(uDen, q).r;
  if (b < 0.003) return 0.0;
  float dn = texture(uDet, q * uDetScale).r;
  return keep * max(0.0, b - uDetail * (1.0 - dn) * (1.0 - b) * 1.6);
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
// A capped cylinder along a, radius R, half-length h. ax: where along the axis the hit is; ed: how far it is from
// the nearest rim.
float hitCyl(vec3 ro, vec3 rd, vec3 c, vec3 a, float R, float h, out vec3 n, out float ax, out float ed) {
  vec3 oc = ro - c;
  float cd = dot(a, rd), co = dot(a, oc);
  float A = max(1.0 - cd * cd, 1e-6), B = dot(oc, rd) - co * cd, C = dot(oc, oc) - co * co - R * R;
  float disc = B * B - A * C, tb = 1e9;
  if (disc > 0.0) {
    float t = (-B - sqrt(disc)) / A, y = co + t * cd;
    if (t > 0.0 && abs(y) < h) { tb = t; n = normalize(oc + rd * t - a * y); ax = y; ed = h - abs(y); }
  }
  if (abs(cd) > 1e-6) for (int i = 0; i < 2; i++) {
    float sg = i == 0 ? -1.0 : 1.0, t = (sg * h - co) / cd;
    if (t > 0.0 && t < tb) { vec3 p = oc + rd * t - a * sg * h; float r2 = dot(p, p); if (r2 < R * R) { tb = t; n = a * sg; ax = sg * h; ed = R - sqrt(r2); } }
  }
  return tb;
}
// Flat shading with a key light and an outline along the edges, as the 2D scenes draw their devices.
vec3 shadeCyl(vec3 n, vec3 rd, float ed, float ew) {
  vec3 c = uBodyCol * (0.55 + 0.45 * max(dot(n, normalize(vec3(0.3, 0.8, 0.5))), 0.0));
  c = mix(c, uEdgeCol, smoothstep(ew, ew * 0.4, ed));                 // the rims
  return mix(c, uEdgeCol, smoothstep(0.26, 0.1, abs(dot(n, rd))));    // the silhouette
}
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
  vec2 ndc = ((gl_FragCoord.xy - uOff + jit) / uRes) * 2.0 - 1.0;
  vec3 ro = uCam, rd = normalize(uFwd + ndc.x * uTan.x * uRight + ndc.y * uTan.y * uUp);
  float pix = 2.0 * uTan.y / uRes.y;   // radians per pixel

  // ---- props: the laser, its nozzle, the sensor ----
  float tP = 1e9; vec3 pc = vec3(0.0), n, lp;
  if (uLaserOn > 0.0) {
    // the laser: a cylinder along the beam, a bezel ring, and a narrower nozzle the beam leaves from
    float ax, ed;
    float t = hitCyl(ro, rd, uB0 - uBd * 0.36, uBd, 0.085, 0.3, n, ax, ed);
    if (t < tP) {
      tP = t; pc = shadeCyl(n, rd, ed, 0.012);
      float dotr = length(vec2(ax + 0.14, acos(clamp(dot(n, uBu), -1.0, 1.0)) * 0.085));   // the indicator, on top toward the back
      if (dotr < 0.018) pc = mix(uLaserCol * 2.0, pc, smoothstep(0.014, 0.018, dotr));
    }
    t = hitCyl(ro, rd, uB0 - uBd * 0.055, uBd, 0.1, 0.012, n, ax, ed);
    if (t < tP) { tP = t; pc = shadeCyl(n, rd, ed, 0.006) * 0.8; }
    t = hitCyl(ro, rd, uB0 - uBd * 0.025, uBd, 0.045, 0.028, n, ax, ed);
    if (t < tP) { tP = t; pc = shadeCyl(n, rd, ed, 0.006) * 0.6; }
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
  if (uKeepM >= 0.999) {   // nothing is left outside the zoom's box: march only through it
    vec3 lo = (ro - uKeepC) * uKeepA, ld = rd * uKeepA;
    vec2 kb = boxHit(lo, ld, -uKeepH - 0.01, uKeepH + 0.01);
    tb = vec2(max(tb.x, kb.x), min(tb.y, kb.y));
  }
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
  vec3 prev = texture(uPrev, (gl_FragCoord.xy - uOff) / uRes).rgb;
  o = vec4(mix(prev, col, uBlend), 1.0);
}`;
// Linear radiance to the screen: a soft knee above 0.6, then sRGB.
const V3_FS_SHOW = V3_GLSL_HEAD + `
uniform sampler2D uTex; uniform vec2 uRes, uOff;
out vec4 o;
vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec3 col = max(texture(uTex, (gl_FragCoord.xy - uOff) / uRes).rgb, 0.0);
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
  const R = { gl, canvas, float: !!gl.getExtension('EXT_color_buffer_float'), shapeKey: '', lightKey: '', beamKey: '', err: null };
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
  R.shapeKey = key; R.lightKey = ''; R.beamKey = '';
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

// A camera at pos looking at target, and where a point lands on the stage.
const vLerp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function v3camAt(pos, target, fov) {
  const f = vNorm(vSub(target, pos)), r = vNorm(vCross(f, [0, 1, 0])), u = vCross(r, f);
  const ty = Math.tan((fov * Math.PI) / 360), tx = ty * (W / H);
  const project = (p) => { const v = vSub(p, pos), z = vDot(v, f); if (z <= 1e-4) return null; return [W / 2 + (vDot(v, r) / (z * tx)) * (W / 2), H / 2 - (vDot(v, u) / (z * ty)) * (H / 2), z]; };
  return { pos, f, r, u, tx, ty, fov, project };
}
const V3_TARGET = [0, 0.02, 0];
// What the orbit camera looks at: the cloud, or, while the eye is shown, a point between the eye and the cloud.
function v3target(st) {
  if (st.eye <= 0.003) return V3_TARGET;
  const el = (st.eyeEl * Math.PI) / 180, az = (st.eyeAz * Math.PI) / 180;
  const e = [st.eyeDist * Math.cos(el) * Math.sin(az), V3_TARGET[1] + st.eyeDist * Math.sin(el), st.eyeDist * Math.cos(el) * Math.cos(az)];
  return vLerp(V3_TARGET, vLerp(V3_TARGET, e, 0.42), smooth(clamp(st.eye, 0, 1)));
}
// The orbit camera around that point.
function v3cam(st) {
  const cp = Math.cos(st.pitch), t = v3target(st);
  return v3camAt([t[0] + st.dist * cp * Math.sin(st.yaw), t[1] + st.dist * Math.sin(st.pitch), t[2] + st.dist * cp * Math.cos(st.yaw)], t, st.fov);
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
  R.beamTab = tab; R.beamD = tab[n - 1]; R.beamKey = key;
}
// A view: its own size and its own pair of float targets, where its frames are averaged while nothing changes.
const g3newView = () => ({ w: 0, h: 0, acc: [], ping: 0, sig: '', frames: 0 });
function g3viewTargets(R, V, w, h) {
  if (V.w === w && V.h === h) return;
  const gl = R.gl; V.w = w; V.h = h; V.sig = '';
  for (const a of V.acc) { gl.deleteTexture(a.t); gl.deleteFramebuffer(a.f); }
  V.acc = [];
  if (!R.float) return;
  for (let i = 0; i < 2; i++) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    V.acc.push({ t, f });
  }
  V.ping = 0;
}
const V3_QUALITY = { low: [0.55, 64], medium: [0.9, 100], high: [1.4, 160] };
const v3sun = (st) => { const el = (st.sunEl * Math.PI) / 180, az = (st.sunAz * Math.PI) / 180; return [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)]; };
// One frame of a view. With float targets it is averaged into the view's own textures (shown later by
// g3present); without them it is tone-mapped straight into the canvas at rect (x, y in canvas pixels).
// o: { vol, eye, rect }: vol fades the cloud and the beam (the zoom), eye draws the eye.
function g3draw(R, V, st, cam, B, w, h, steps, o = {}) {
  const gl = R.gl;
  g3viewTargets(R, V, w, h);
  const sun = v3sun(st), vol = o.vol ?? 1;
  g3shape(R, st); g3light(R, sun); g3beamTable(R, st, B);
  const sigA = st.sigA * st.absorb * st.dens * vol, sigS = st.sigS * st.scatter * st.dens * vol, lc = toLin(SH.color), eye = o.eye || null, bpow = st.bpow * SH.I0 * (o.beam ?? 1);
  const sig = JSON.stringify([w, h, steps, cam.pos, cam.f, cam.fov, sun, sigA, sigS, o.keep ? o.keep.m : 0, st.g, st.powder, st.sun, st.sunI, st.amb, st.detail, st.detScale, st.bg, B.b0, B.d, st.bw, bpow, st.front, st.core, st.laser, lc, eye, R.shapeKey]);
  if (sig !== V.sig) { V.sig = sig; V.frames = 0; }
  const accum = R.float && V.acc.length === 2 && st.accum > 0.5;
  if (accum && V.frames >= 160) return;   // settled
  const P = R.pRender, u = P.u, rect = o.rect || [0, 0];
  gl.useProgram(P.p);
  if (accum) { gl.bindFramebuffer(gl.FRAMEBUFFER, V.acc[1 - V.ping].f); gl.viewport(0, 0, w, h); gl.uniform2f(u.uOff, 0, 0); }
  else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(rect[0], rect[1], w, h); gl.uniform2f(u.uOff, rect[0], rect[1]); }
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_3D, R.den); gl.uniform1i(u.uDen, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_3D, R.det); gl.uniform1i(u.uDet, 1);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_3D, R.light); gl.uniform1i(u.uLight, 2);
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, R.beam); gl.uniform1i(u.uBeam, 3);
  gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, accum ? V.acc[V.ping].t : null); gl.uniform1i(u.uPrev, 4);
  gl.uniform2f(u.uRes, w, h); gl.uniform1f(u.uFrame, V.frames); gl.uniform1f(u.uBlend, accum ? 1 / (V.frames + 1) : 1); gl.uniform1f(u.uDirect, accum ? 0 : 1);
  gl.uniform3fv(u.uCam, cam.pos); gl.uniform3fv(u.uFwd, cam.f); gl.uniform3fv(u.uRight, cam.r); gl.uniform3fv(u.uUp, cam.u); gl.uniform2f(u.uTan, cam.tx, cam.ty);
  gl.uniform1f(u.uSigA, sigA); gl.uniform1f(u.uSigS, sigS); gl.uniform1f(u.uG, st.g); gl.uniform1f(u.uDetail, st.detail); gl.uniform1f(u.uDetScale, st.detScale); gl.uniform1f(u.uPowder, st.powder);
  gl.uniform3fv(u.uSunDir, sun); gl.uniform3fv(u.uSunCol, [1, 0.94, 0.86]); gl.uniform3fv(u.uAmbCol, st.bg === 'sky' ? [0.45, 0.58, 0.8] : [0.62, 0.6, 0.58]);
  gl.uniform1f(u.uSun, st.sun * st.sunI); gl.uniform1f(u.uAmb, st.amb); gl.uniform1i(u.uSteps, steps);
  gl.uniform3fv(u.uB0, B.b0); gl.uniform3fv(u.uBd, B.d); gl.uniform3fv(u.uBu, B.u); gl.uniform3fv(u.uBv, B.v); gl.uniform3fv(u.uLaserCol, lc);
  gl.uniform1f(u.uBLen, B.len); gl.uniform1f(u.uBW, st.bw); gl.uniform1f(u.uBPow, bpow); gl.uniform1f(u.uFront, st.front); gl.uniform1f(u.uCore, st.core); gl.uniform1f(u.uLaserOn, st.laser);
  gl.uniform1i(u.uBg, st.bg === 'sky' ? 1 : st.bg === 'light' ? 2 : 0); gl.uniform3fv(u.uBgCol, toLin(BG)); gl.uniform3fv(u.uBodyCol, toLin(BODY)); gl.uniform3fv(u.uEdgeCol, toLin(COL.greyB));
  gl.uniform1f(u.uEyeOn, eye ? 1 : 0); gl.uniform3fv(u.uEyePos, eye ? eye.pos : [0, 0, 0]); gl.uniform3fv(u.uEyeDir, eye ? eye.dir : [1, 0, 0]);
  const kp = o.keep;
  gl.uniform1f(u.uKeepM, kp ? kp.m : 0); gl.uniform3fv(u.uKeepC, kp ? kp.c : [0, 0, 0]); gl.uniform3fv(u.uKeepH, kp ? kp.h : [1, 1, 1]);
  gl.uniformMatrix3fv(u.uKeepA, false, kp ? [...kp.a[0], ...kp.a[1], ...kp.a[2]] : [1, 0, 0, 0, 1, 0, 0, 0, 1]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  if (accum) { V.ping = 1 - V.ping; V.frames++; }
}
// Show averaged views in the canvas: [{ V, rect: [x, y] }] in canvas pixels, GL's origin at the bottom left.
function g3present(R, list) {
  if (!R.float) return;
  const gl = R.gl, P = R.pShow;
  gl.useProgram(P.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  for (const { V, rect } of list) {
    if (V.acc.length !== 2) continue;
    gl.viewport(rect[0], rect[1], V.w, V.h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, V.acc[V.ping].t); gl.uniform1i(P.u.uTex, 0);
    gl.uniform2f(P.u.uRes, V.w, V.h); gl.uniform2f(P.u.uOff, rect[0], rect[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

// ---------- zooming into the beam, down to the particles of "Shadows in a slab" ----------
// The camera turns to look at the beam side on, at the point halfway through the cloud's density along it, and
// closes in until the beam is as wide as that scene's sheet of rays. The smooth cloud thins away and its
// particles take over: the shadows scene's own discs and rays, placed in the plane of the beam, so the last
// frame is that scene, which then takes over.
function v3landing(R, st, B) {
  const tab = R.beamTab, total = tab[tab.length - 1];
  let i = 0; while (i < tab.length - 1 && tab[i] < total / 2) i++;
  const P0 = vAdd(B.b0, vMul(B.d, total > 1e-4 ? (i / (tab.length - 1)) * B.len : B.len / 2));
  const k = (SL.bot - SL.top) / (4 * st.bw), ty = Math.tan((st.fov * Math.PI) / 360), d1 = H / 2 / (k * ty);
  const cx1 = (SL.x0 + SL.x1) / 2, cy1 = (SL.top + SL.bot) / 2;
  const C = vAdd(vAdd(P0, vMul(B.d, (W / 2 - cx1) / k)), vMul(B.u, -(H / 2 - cy1) / k));
  const toWorld = (x, y) => vAdd(vAdd(C, vMul(B.d, (x - W / 2) / k)), vMul(B.u, (H / 2 - y) / k));
  const keep = { c: P0, a: [B.d, B.u, B.v], h: [(SL.x1 - SL.x0) / 2 / k + 0.025, (SL.bot - SL.top) / 2 / k + 0.03, 0.035] };
  return { P0, C, n: B.v, d1, k, toWorld, keep };
}
function v3zoomCam(st, R, B) {
  const cam0 = v3cam(st); if (st.zoom <= 1e-4) return cam0;
  const L = v3landing(R, st, B), e = smooth(clamp(st.zoom, 0, 1));
  const t0 = v3target(st), target = vLerp(t0, L.C, e), dir = vNorm(vLerp(vNorm(vSub(cam0.pos, t0)), L.n, e)), dist = Math.exp(lerp(Math.log(st.dist), Math.log(L.d1), e));
  return v3camAt(vAdd(target, vMul(dir, dist)), target, st.fov);
}
// The particles and rays of the shadows scene, seen through the 3D camera; at the end, its laser, sensor and plot.
function drawZoomParticles(ctx, st, cam, L) {
  const s = st.zoom, pa = smooth(clamp((s - 0.5) / 0.35, 0, 1)), land = smooth(clamp((s - 0.78) / 0.22, 0, 1));
  if (pa <= 0.003) return;
  const S = shadowsState(SA), color = SH.color, sx = S.sx, P = (x, y) => cam.project(L.toWorld(x, y));
  const layer = (side) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(color, 0.95 * pa * SH.I0); ctx.lineWidth = 1.8; ctx.beginPath();
    const x0 = lerp(-1600, SL.ex, land);
    for (let i = 0; i < S.k; i++) {
      const a = P(x0, S.ys[i]), b = P(Math.min(S.hits[i], W + 10), S.ys[i]);
      if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    }
    ctx.stroke();
    if (SA.marks > 0.003) for (let i = 0; i < S.k; i++) if (S.hits[i] < W) { const q = P(S.hits[i], S.ys[i]); if (q) dot(ctx, q[0], q[1], 3.2 * (L.k ? 1 : 1), '#FFFFFF', 0.85 * SA.marks * pa); }
    ctx.restore();
    ctx.save(); ctx.fillStyle = PART; ctx.strokeStyle = COL.greyB; ctx.globalAlpha = pa; ctx.lineWidth = Math.min(2.5, S.R * 0.3); ctx.beginPath();
    for (const [x, y] of S.pos) { const q = P(x, y); if (!q) continue; const rr = (S.R / L.k) * (H / 2) / (q[2] * cam.ty); if (rr < 0.4) continue; ctx.moveTo(q[0] + rr, q[1]); ctx.arc(q[0], q[1], rr, 0, Math.PI * 2); }
    ctx.fill(); ctx.stroke(); ctx.restore();
  };
  // as in the shadows scene, what lies past the sensor is drawn faded once the picture is that scene's
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, lerp(W, sx, land), H); ctx.clip(); layer(); ctx.restore();
  if (land > 0.003) {
    ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, W - sx, H); ctx.clip(); ctx.globalAlpha = 0.22; layer(); ctx.restore();
    ctx.save(); ctx.globalAlpha = land;
    dashed(ctx, SL.x0, SL.top - 70, SL.x0, SL.bot + 70, COL.greyC, 1, 2); dashed(ctx, SL.x1, SL.top - 70, SL.x1, SL.bot + 70, COL.greyC, 1, 2);
    drawSheetLaser(ctx, SL.ex, SL.top, SL.bot, color);
    ctx.lineWidth = 3; ctx.strokeStyle = COL.greyB; ctx.fillStyle = BODY; ctx.beginPath(); ctx.roundRect(sx, SL.top - 30, 26, SL.bot - SL.top + 60, 6); ctx.fill(); ctx.stroke();
    ctx.restore();
    let reach = 0; for (const h of S.hits) if (h > sx) reach++;
    drawShadowsReadout(ctx, sx, reach / S.k, land);
    drawShadowsPlot(ctx, SA, S, land);
  }
}

// ---------- the eye: what it sees, and the rays it sees along ----------
function v3eye(st) {
  const el = (st.eyeEl * Math.PI) / 180, az = (st.eyeAz * Math.PI) / 180, t = V3_TARGET;
  const pos = [t[0] + st.eyeDist * Math.cos(el) * Math.sin(az), t[1] + st.eyeDist * Math.sin(el), t[2] + st.eyeDist * Math.cos(el) * Math.cos(az)];
  return { pos, dir: vNorm(vSub(t, pos)), cam: v3camAt(pos, t, st.eyeFov) };
}
const V3_INSET = { x: W - 560 - 28, y: 28, w: 560, h: 315 };
// A few of the eye's rays, marched through the cloud: a dot at each step that finds density, fainter as the
// light from there has less of a chance to reach the eye.
function drawEyeRays(ctx, st, R, cam, E, a) {
  const ec = E.cam, dirs = [[0, 0], [-0.55, 0.45], [0.55, 0.45], [-0.55, -0.45], [0.55, -0.45]], sig = (st.sigA * st.absorb + st.sigS * st.scatter) * st.dens;
  ctx.save();
  for (let i = 0; i < dirs.length; i++) {
    const [dx, dy] = dirs[i], rd = vNorm(vAdd(vAdd(ec.f, vMul(ec.r, dx * ec.tx)), vMul(ec.u, dy * ec.ty)));
    // where the ray crosses the cloud's box
    let t0 = 0, t1 = 8;
    for (let k = 0; k < 3; k++) { const o = E.pos[k], d = rd[k]; if (Math.abs(d) < 1e-6) { if (o < -1 || o > 1) t1 = -1; continue; } let ta = (-1 - o) / d, tb = (1 - o) / d; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); }
    // march first: the dots where the ray meets cloud, and where the cloud ends along it
    const dots = []; let tLast = -1;
    if (t1 > t0) {
      let T = 1; const dt = 0.06;
      for (let t = t0 + dt / 2; t < t1; t += dt) {
        const p = vAdd(E.pos, vMul(rd, t)), rho = g3density(R, st, p[0], p[1], p[2]);
        if (rho > 0.02) { dots.push([p, T]); tLast = t; }
        T *= Math.exp(-sig * rho * dt);
      }
    }
    // the ray runs a little past the cloud and fades out there, so it never reads as a leader line to a label
    const tEnd = tLast > 0 ? tLast + 0.3 : t1 > t0 ? t1 : 3, A = cam.project(E.pos), B2 = cam.project(vAdd(E.pos, vMul(rd, tEnd)));
    if (!A || !B2) continue;
    const al = (i ? 0.5 : 0.85) * a, gr = ctx.createLinearGradient(A[0], A[1], B2[0], B2[1]);
    gr.addColorStop(0, hexA(COL.white, al)); gr.addColorStop(0.75, hexA(COL.white, al)); gr.addColorStop(1, hexA(COL.white, 0));
    ctx.strokeStyle = gr; ctx.lineWidth = i ? 1.6 : 2.4; ctx.setLineDash(i ? [8, 8] : []);
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B2[0], B2[1]); ctx.stroke(); ctx.setLineDash([]);
    for (const [p, T] of dots) { const q = cam.project(p); if (q) dot(ctx, q[0], q[1], i ? 3.5 : 5, i ? COL.white : COL.yellow, a * clamp(T * 1.4, 0.12, 1)); }
  }
  ctx.restore();
}

// ---------- K. a cloud in 3D ----------
// Drag to orbit, scroll to come closer. Turn scattering and absorption on and off: with absorption alone the cloud
// is a dark smoke that only dims what is behind it, and the beam cannot be seen from the side at all, only where it
// lands; with scattering, sunlight and the beam light the cloud up. Either way the sensor reads less, because both
// take light out of the beam: T = e^{−(σa + σs) ∫ρ ds}. Zoom into the beam and the cloud resolves into the particles
// of "Shadows in a slab"; show the eye and see the rays it looks along, and what it sees.
const SK = defScene({
  id: 'cloud', tab: 'Cloud in 3D', shared: true,
  defaults: () => ({ yaw: 0.62, pitch: 0.16, dist: 4.6, fov: 34,
    dens: 1, sigA: 0.8, sigS: 10, absorb: 1, scatter: 1, g: 0.55, detail: 0.55, detScale: 3, billow: 0.5, erode: 0.3, seed: 1, powder: 0.6,
    sun: 1, sunAz: -55, sunEl: 26, sunI: 24, amb: 0.22, bg: 'stage',
    laser: 1, front: 1, beamY: 0, beamZ: 0.5, aim: 0, aimUp: 0, bw: 0.012, bpow: 1, core: 1,
    zoom: 0, zoomT: 5, eye: 0, eyeAz: -48, eyeEl: 10, eyeDist: 3.1, eyeFov: 40, inset: 1, readout: 1,
    quality: 'medium', accum: 1, shown: null }),
  actions: [
    { id: 'shine', label: 'Shine', primary: true, run: (st) => { untween(st, 'front'); st.front = 0; st.shown = null; return tween(st, 'front', 1, 2.4, { ease: linear }); } },
    { id: 'orbit', label: 'Orbit', run: (st) => tween(st, 'yaw', st.yaw + Math.PI * 2, 16, { ease: linear }) },
    { id: 'scatter', label: 'Scattering on / off', run: (st) => tween(st, 'scatter', st.scatter > 0.5 ? 0 : 1, 1.2) },
    { id: 'absorb', label: 'Absorption on / off', run: (st) => tween(st, 'absorb', st.absorb > 0.5 ? 0 : 1, 1.2) },
    { id: 'sun', label: 'Sun on / off', run: (st) => tween(st, 'sun', st.sun > 0.5 ? 0 : 1, 1.2) },
    { id: 'zoomin', label: 'Zoom into the beam', run: async (st, alive) => {
      untween(st, 'front'); st.front = 1; tween(st, 'eye', 0, 0.6);
      await tween(st, 'zoom', 1, st.zoomT); if (!alive() || st.zoom < 0.999) return;
      if (cur === scenes.cloud) { setScene('shadows'); st.zoom = 0; }
    } },
    { id: 'zoomout', label: 'Zoom out', run: (st) => tween(st, 'zoom', 0, st.zoomT * 0.8) },
    { id: 'eye', label: 'The eye', run: (st) => {
      const on = st.eye < 0.5;
      if (on) {   // look across the line from the eye to the cloud, so both are in view
        const yaw = (st.eyeAz * Math.PI) / 180 + Math.PI / 2;
        let dy = ((yaw - st.yaw) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
        tween(st, 'yaw', st.yaw + dy, 1.8); tween(st, 'pitch', 0.28, 1.8); tween(st, 'dist', Math.max(st.dist, 6.4), 1.8);
      }
      return tween(st, 'eye', on ? 1 : 0, 1.4);
    } },
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
    { type: 'check', key: 'readout', label: 'Reading', set: (v) => { SK.readout = v ? 1 : 0; } },
    { type: 'check', key: 'core', label: 'Beam core (seen without scattering)', set: (v) => tween(SK, 'core', v ? 1 : 0, 0.6) },
    { type: 'check', key: 'eye', label: 'Eye', set: (v) => tween(SK, 'eye', v ? 1 : 0, 0.8) },
    { type: 'check', key: 'inset', label: 'What the eye sees', visible: (st) => st.eye > 0.5, set: (v) => { SK.inset = v ? 1 : 0; } },
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
    { type: 'range', key: 'eyeAz', label: 'Eye around (°)', min: -180, max: 180, step: 1, fmt: (v) => String(v), visible: (st) => st.eye > 0.5 },
    { type: 'range', key: 'eyeEl', label: 'Eye height (°)', min: -40, max: 70, step: 1, fmt: (v) => String(v), visible: (st) => st.eye > 0.5 },
    { type: 'range', key: 'eyeDist', label: 'Eye distance', min: 1.6, max: 6, step: 0.05, fmt: (v) => v.toFixed(2), visible: (st) => st.eye > 0.5 },
    { type: 'range', key: 'zoomT', label: 'Zoom time (s)', min: 1, max: 15, step: 0.1, fmt: (v) => v.toFixed(1) },
    { type: 'range', key: 'detail', label: 'Edge detail', min: 0, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'powder', label: 'Dark edges (powder)', min: 0, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'billow', label: 'Billow (new shape)', min: 0, max: 0.8, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'erode', label: 'Erosion (new shape)', min: 0, max: 0.8, step: 0.01, fmt: (v) => v.toFixed(2) },
    { type: 'range', key: 'fov', label: 'Field of view (°)', min: 15, max: 70, step: 1, fmt: (v) => String(v) },
    { type: 'note', html: 'Drag to orbit, scroll to zoom. With the camera still, frames are averaged until the picture settles. Light box shows absorption best: with scattering off, the cloud only darkens what is behind it.' },
  ],
  draw: drawCloud3D, pointer: pointerCloud3D, wheel: (dy) => { if (SK.zoom < 1e-4) SK.dist = clamp(SK.dist * Math.exp(dy * 0.0012), 1.8, 9); },
});
function g3unavailable(ctx, R) {
  drawTex(ctx, String.raw`\text{WebGL2 is needed for the 3D scenes}`, W / 2, H / 2 - 30, 56, {});
  if (R && R.err) { ctx.save(); ctx.font = '400 22px monospace'; ctx.fillStyle = COL.grey; ctx.textAlign = 'center'; ctx.fillText(R.err.slice(0, 160), W / 2, H / 2 + 50); ctx.restore(); }
}
function drawCloud3D(ctx, dt, st) {
  const R = g3();
  if (!R || R.err) { g3unavailable(ctx, R); return; }
  if (!R.main) { R.main = g3newView(); R.inset = g3newView(); }
  const B = v3beam(st);
  g3shape(R, st); g3beamTable(R, st, B);
  const cam = v3zoomCam(st, R, B), L = st.zoom > 1e-4 ? v3landing(R, st, B) : null;
  const [qs, steps] = V3_QUALITY[st.quality] || V3_QUALITY.medium;
  const w = Math.max(96, Math.round(Math.min(2048, (cssW || 960) * qs))), h = Math.max(54, Math.round((w * H) / W));
  if (R.canvas.width !== w || R.canvas.height !== h) { R.canvas.width = w; R.canvas.height = h; }
  const vol = 1 - smooth(clamp((st.zoom - 0.55) / 0.3, 0, 1)), E = st.eye > 0.003 ? v3eye(st) : null, ea = st.eye * (1 - smooth(clamp(st.zoom * 3, 0, 1)));
  const keep = L ? { ...L.keep, m: smooth(clamp((st.zoom - 0.05) / 0.3, 0, 1)) } : null, beam = 1 - smooth(clamp((st.zoom - 0.3) / 0.3, 0, 1));
  g3draw(R, R.main, st, cam, B, w, h, steps, { vol, beam, keep, eye: E && ea > 0.5 ? { pos: E.pos, dir: E.dir } : null });
  const views = [{ V: R.main, rect: [0, 0] }], inset = E && st.inset > 0.5 && ea > 0.5;
  const sc = w / W, IR = V3_INSET;
  if (inset) {
    const iw = Math.round(IR.w * sc), ih = Math.round(IR.h * sc), rect = [Math.round(IR.x * sc), Math.round(h - (IR.y + IR.h) * sc)];
    g3draw(R, R.inset, st, E.cam, B, iw, ih, Math.round(steps * 0.8), { rect });
    views.push({ V: R.inset, rect });
  }
  g3present(R, views);
  const land = L ? smooth(clamp((st.zoom - 0.78) / 0.22, 0, 1)) : 0;
  ctx.save(); if (land > 0) { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1 - land; }
  ctx.drawImage(R.canvas, 0, 0, W, H); ctx.restore();
  if (L) {
    // the box being zoomed into, outlined while the rest of the cloud fades
    const ba = smooth(clamp(st.zoom / 0.12, 0, 1)) * (1 - smooth(clamp((st.zoom - 0.45) / 0.2, 0, 1)));
    if (ba > 0.003) {
      const K = L.keep, cs = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) cs.push(cam.project(vAdd(K.c, vAdd(vAdd(vMul(K.a[0], sx * K.h[0]), vMul(K.a[1], sy * K.h[1])), vMul(K.a[2], sz * K.h[2])))));
      ctx.save(); ctx.strokeStyle = hexA(COL.white, 0.85 * ba); ctx.lineWidth = 2; ctx.beginPath();
      for (const [i, j] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) if (cs[i] && cs[j]) { ctx.moveTo(cs[i][0], cs[i][1]); ctx.lineTo(cs[j][0], cs[j][1]); }
      ctx.stroke(); ctx.restore();
    }
    drawZoomParticles(ctx, st, cam, L);
  }
  // the eye's rays, outside the inset
  if (E && ea > 0.003) {
    ctx.save();
    if (inset) { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(IR.x - 6, IR.y - 6, IR.w + 12, IR.h + 60); ctx.clip('evenodd'); }
    drawEyeRays(ctx, st, R, cam, E, ea);
    const q = cam.project(vAdd(E.pos, [0, 0.2, 0]));
    if (q) drawTex(ctx, String.raw`L(\mathbf{p},\omega)`, q[0], q[1] - 34, 50, { alpha: ea });
    ctx.restore();
    if (inset) {
      ctx.save(); ctx.globalAlpha = ea; ctx.strokeStyle = COL.greyB; ctx.lineWidth = 2.5; ctx.strokeRect(IR.x, IR.y, IR.w, IR.h); ctx.restore();
      drawTex(ctx, String.raw`\text{what the eye sees}`, IR.x + IR.w / 2, IR.y + IR.h + 30, 36, { alpha: ea, color: COL.greyB });
    }
  }
  // the sensor's reading: the beam's transmittance through the cloud, absorption and scattering together
  const reading = st.laser > 0.5 && st.front >= 0.999 && SH.I0 > 0 ? Math.exp(-(st.sigA * st.absorb + st.sigS * st.scatter) * st.dens * (R.beamD || 0)) : null;
  st.shown = reading == null ? null : st.shown == null || reduced ? reading : lerp(st.shown, reading, 1 - Math.exp(-dt * 6));
  const ra = 1 - smooth(clamp(st.zoom * 4, 0, 1));
  if (st.shown != null && ra > 0.01 && st.readout > 0.5) {
    const top = cam.project(vAdd(vAdd(B.b0, vMul(B.d, B.len + 0.012)), vMul(B.u, 0.2)));
    if (top) { const bw = 210, bh = 84, bx = clamp(top[0] - bw / 2, 20, W - bw - 20), by = clamp(top[1] - bh - 20, 20, H - bh - 20); readoutBox(ctx, bx, by + bh / 2, st.shown, ra); }
  }
}
function pointerCloud3D(type, x, y) {
  const st = SK, sc = scenes.cloud;
  if (st.zoom > 1e-4) return false;
  if (type === 'down') { sc.drag = [x, y]; untween(st, 'yaw'); return true; }
  if (type === 'up') { sc.drag = null; return false; }
  if (sc.drag) { st.yaw -= (x - sc.drag[0]) * 0.0045; st.pitch = clamp(st.pitch + (y - sc.drag[1]) * 0.0035, -1.2, 1.35); sc.drag = [x, y]; return true; }
  return true;
}
