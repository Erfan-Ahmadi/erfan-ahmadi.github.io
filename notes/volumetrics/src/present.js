// ---------- presentation mode: the video, one key press per beat ----------
// V (or the Present button) hides the controls and plays the script's beats on the stage: → or Enter for the next
// beat, ← for the one before, Space pauses every animation, R replays the beat, Home and End jump, Esc leaves.
// Going to a beat rebuilds the ones before it instantly, so stepping back shows a beat the way it ends. The state
// of a presentation lives in PS; the scenes it borrows (the cloud) keep their own.
const PRES = { on: false, paused: false, beat: 0, toast: -99, epoch: 0 };
const PS_DEFAULTS = () => ({ orbit: 1, mag: 0, aside: 0, fig: 0, thoughts: 0, think: '', writeP: 1, eq: 0, eqP: 0, corner: 0, braces: [], hiTerm: null, hi: {}, dim: 0, box: 0, cap: '', capP: 0 });
const PS = PS_DEFAULTS();
// Placeholders for what the figure thinks while the narration is about me; replace them with the real thoughts.
const THOUGHTS = ['clouds… from physics?!', 'one day', 'later. definitely later.'];
// The equation, with its terms named: the four effects for the braces, and the parts the questions point at.
const PRTE = String.raw`L(p,\omega) = \htmlClass{t-qouter}{\int_0^{d}} \htmlClass{t-qe}{e}^{\htmlClass{t-qexp}{\htmlClass{t-pabs}{-\int_0^{t}\sigma_a(p_s)\,ds}\htmlClass{t-pout}{-\int_0^{t}\sigma_s(p_s)\,ds}}}\left[\htmlClass{t-pem}{\sigma_a(p_t)\,L_e(p_t,\omega)} + \htmlClass{t-pin}{\sigma_s(p_t)\int_{4\pi} f_p(\omega,\omega')\,L(p_t,\omega')\,d\omega'}\right]\htmlClass{t-qouter}{dt}`;
Object.assign(TERM_COL, { 't-pabs': hexRgb(COL.red), 't-pout': hexRgb(COL.red), 't-pem': hexRgb(COL.green), 't-pin': hexRgb(COL.green), 't-qe': WHITE_RGB, 't-qexp': WHITE_RGB, 't-qouter': WHITE_RGB });
const PEQ = { x: 960, y: 470, size: 76, fit: 1760 };
let peqSprites = null;
const peq = () => peqSprites || (peqSprites = place(tex(PRTE), { ...PEQ, size: Math.min(PEQ.size, PEQ.fit / Math.max(tex(PRTE).w, 0.01)) }));
const ptw = (key, to, dur, o = {}) => tween(PS, key, to, dur, { tag: 'pres', ...o });
// The beats: a name and what happens when it is reached. Each returns when its animation is done.
const BEATS = [
  { name: 'the cloud', run: () => { Object.assign(PS, PS_DEFAULTS()); SK.zoom = 0; SK.eye = 0; SK.laser = 1; untween(SK, 'front'); SK.front = 1; } },
  { name: 'the magnifier', run: () => ptw('mag', 1, 1.6) },
  { name: 'aside: me', run: async () => { ptw('fig', 1, 1.2, { delay: 0.9 }); await ptw('aside', 1, 1.6); } },
  ...THOUGHTS.map((t, i) => ({ name: `thought ${i + 1}`, run: () => { PS.thoughts = i + 1; PS.think = t; PS.writeP = 0; return ptw('writeP', 1, 0.9, { ease: linear }); } })),
  { name: 'the equation', run: async () => {
    PS.think = '?'; PS.writeP = 1; PS.eq = 1; PS.eqP = 0;
    ptw('corner', 1, 1.4); ptw('aside', 2, 1.4);
    await ptw('eqP', 1, 3.2, { ease: linear, delay: 0.5 });
  } },
  { name: 'four effects', run: async () => {
    const list = [['t-pabs', 'absorption', COL.red], ['t-pout', 'out-scattering', COL.red], ['t-pem', 'emission', COL.green], ['t-pin', 'in-scattering', COL.green]];
    for (let i = 0; i < list.length; i++) { const p = presBrace(...list[i]); if (i < list.length - 1) await sleep(0.7, 'pres'); else await p; }
  } },
  { name: 'why e?', run: () => presQuestion('t-qe', String.raw`\text{why } e\text{?}`) },
  { name: 'why an integral in the exponent?', run: () => presQuestion('t-qexp', String.raw`\text{why an integral in the exponent?}`) },
  { name: 'why another integral?', run: () => presQuestion('t-qouter', String.raw`\text{inside another integral?}`) },
];
// A brace under a term of the equation, in the equation scene's style.
function presBrace(term, label, color) {
  const ss = peq().filter((s) => s.a.terms.includes(term)); if (!ss.length) return Promise.resolve();
  let x0 = Infinity, x1 = -Infinity, yb = -Infinity;
  for (const s of ss) { const [l, r, , b] = inkBox(s); x0 = Math.min(x0, l); x1 = Math.max(x1, r); yb = Math.max(yb, b); }
  const size = peq()[0].size, fpx = 1.21 * size, lsize = size * 0.6, LT = tex(String.raw`\text{${label}}`), cx = (x0 + x1) / 2, lw = LT.w * lsize, lh = LT.h * lsize;
  const b = { term, x0, x1, top: yb + fpx * 0.12, h: fpx * 0.3, th: Math.max(3, fpx * 0.055), color: hexRgb(color), g: 0, l: 0, a: 1 };
  let ly = b.top + b.h + fpx * 0.1 + lh / 2;
  for (let guard = 0; guard < 6 && PS.braces.some((o) => Math.abs(o.ly - ly) < lh * 0.9 && !(cx + lw / 2 + 24 < o.lx0 || cx - lw / 2 - 24 > o.lx1)); guard++) ly += lh * 1.05;
  Object.assign(b, { ly, lx0: cx - lw / 2, lx1: cx + lw / 2, lab: place(LT, { x: cx, y: ly, size: lsize }) });
  PS.braces.push(b);
  tween(PS.hi, term, 1, 0.5, { tag: 'pres' });
  return Promise.all([tween(b, 'g', 1, 0.75, { tag: 'pres' }), tween(b, 'l', 1, 0.5, { delay: 0.4, tag: 'pres' })]);
}
// A question: the braces go, the named part keeps its colour inside a box, the rest greys out, a caption under it.
async function presQuestion(term, caption) {
  for (const k of Object.keys(PS.hi)) if (k !== term) tween(PS.hi, k, 0, 0.5, { tag: 'pres' });
  for (const b of PS.braces) tween(b, 'a', 0, 0.5, { tag: 'pres' });
  tween(PS.hi, term, 1, 0.6, { tag: 'pres' }); ptw('dim', 1, 0.7);
  PS.hiTerm = term; PS.cap = caption; PS.capP = 0;
  if (PS.box < 1) ptw('box', 1, 0.6); else { PS.box = 0; ptw('box', 1, 0.6); }
  await ptw('capP', 1, 0.8, { ease: linear, delay: 0.3 });
}
async function presGo(k, play) {
  k = clamp(k, 0, BEATS.length - 1);
  const e = ++PRES.epoch; stopTweens('pres'); PRES.beat = k; PRES.toast = TIME;
  Object.assign(PS, PS_DEFAULTS());
  instant++;
  try { for (let i = 0; i < (play ? k : k + 1); i++) await BEATS[i].run(); } catch (err) { console.error(err); } finally { instant--; }
  if (e !== PRES.epoch) return;
  if (play) Promise.resolve(BEATS[k].run()).catch((err) => { if (e === PRES.epoch) console.error(err); });
}
function setPresent(on, beat = 0) {
  PRES.on = on; PRES.paused = false;
  document.body.classList.toggle('presenting', on);
  setClean(on);
  if (on) { SK.yaw = 0.62; SK.pitch = 0.16; SK.dist = 4.6; presGo(beat, true); }
  else { stopTweens('pres'); SK.yaw = 0.62; }
}
function presKey(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === ' ') PRES.paused = !PRES.paused;
  else if (['ArrowRight', 'ArrowDown', 'PageDown', 'Enter'].includes(k)) { if (PRES.beat < BEATS.length - 1) presGo(PRES.beat + 1, true); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) presGo(PRES.beat - 1, false);
  else if (k === 'Home') presGo(0, false);
  else if (k === 'End') presGo(BEATS.length - 1, false);
  else if (k === 'r' || k === 'R') presGo(PRES.beat, true);
  else if (k === 'f' || k === 'F') toggleFull();
  else if (k === 'Escape') setPresent(false);
  else return;
  e.preventDefault();
}
// ---- drawing ----
// The stick figure: Erfan's own drawing (six pencil strokes, traced from his SVG, in its 346 × 848 box), drawn
// with round white strokes. (x, y) is where its feet stand; s scales it (1 is 230 px tall).
const FIGURE = [[[86,241],[84,238],[82,236],[81,234],[80,232],[79,230],[76,225],[74,223],[73,220],[71,218],[70,216],[68,214],[67,211],[66,208],[65,206],[64,203],[62,200],[61,197],[61,194],[60,191],[59,188],[58,185],[58,182],[57,178],[56,175],[56,172],[55,169],[54,165],[54,163],[53,158],[53,155],[53,152],[52,149],[52,146],[52,142],[52,138],[52,134],[52,130],[52,126],[52,122],[53,118],[53,114],[53,111],[54,109],[55,106],[56,103],[56,100],[58,97],[59,95],[60,93],[61,90],[62,88],[63,86],[66,82],[67,80],[69,77],[70,76],[72,73],[74,71],[76,69],[80,66],[82,65],[84,63],[87,61],[90,59],[92,57],[94,56],[96,55],[99,54],[102,53],[104,52],[107,51],[110,50],[113,50],[116,49],[119,48],[123,47],[126,46],[130,45],[132,45],[135,44],[139,43],[142,43],[145,42],[148,41],[151,40],[154,40],[157,39],[160,39],[163,39],[166,38],[169,38],[172,38],[175,38],[178,39],[180,40],[182,42],[184,44],[186,46],[188,48],[190,50],[192,52],[194,54],[195,56],[198,59],[199,60],[200,63],[201,66],[203,68],[204,70],[205,72],[207,75],[208,77],[209,79],[210,82],[211,85],[212,88],[213,90],[214,93],[215,95],[216,98],[217,101],[218,104],[218,108],[219,111],[220,114],[221,117],[221,120],[222,123],[222,126],[223,129],[223,133],[223,137],[223,141],[223,144],[223,147],[223,151],[223,154],[223,157],[223,161],[222,163],[221,166],[221,169],[220,171],[219,175],[218,178],[217,180],[216,183],[216,186],[214,188],[214,191],[213,193],[211,195],[210,197],[209,200],[207,202],[206,204],[204,206],[202,207],[200,209],[198,210],[196,212],[194,214],[192,215],[189,216],[187,218],[185,218],[182,219],[179,219],[176,220],[173,221],[170,221],[167,222],[164,222],[161,223],[157,224],[154,224],[151,225],[148,226],[145,227],[142,228],[140,228],[137,229],[134,229],[132,230],[129,230],[127,232],[125,232],[121,233],[118,233],[114,233],[111,233],[107,233],[104,233],[101,233],[98,233],[94,233],[91,233],[88,233],[85,234],[82,234],[80,234]],[[135,220],[135,224],[135,228],[135,232],[135,235],[136,238],[136,242],[137,245],[137,249],[138,252],[138,255],[139,258],[139,262],[139,265],[140,268],[140,272],[141,276],[141,280],[142,284],[142,288],[143,292],[144,295],[144,298],[145,303],[145,308],[146,313],[146,318],[147,324],[147,327],[147,330],[147,333],[148,336],[148,339],[149,342],[149,347],[149,350],[149,354],[150,360],[151,363],[151,366],[152,369],[152,375],[152,379],[153,383],[153,387],[153,391],[153,394],[153,398],[153,402],[154,406],[154,410],[154,414],[154,417],[155,420],[155,424],[155,427],[156,431],[156,435],[156,439],[157,443],[157,446],[157,449],[158,452],[158,456],[158,459],[159,463],[159,467],[159,472],[160,476],[160,479],[161,484],[161,487],[161,491],[162,494],[162,497],[163,499],[163,502],[164,505],[164,509],[165,512],[165,515],[166,520],[166,523],[167,528],[167,531],[168,535],[168,538],[169,541],[169,544],[170,547],[170,550],[170,553],[171,556],[171,559],[172,562],[172,564],[173,568],[173,574],[173,579],[174,582],[174,585],[175,590],[175,593],[175,597],[175,600],[175,603],[176,606],[176,609],[177,612],[178,617],[178,620],[178,623],[179,626],[179,630],[179,634],[180,637],[180,642],[181,647],[181,650],[181,656],[182,660],[182,666],[182,670],[183,674],[183,679],[183,683],[183,686],[184,691],[185,695],[185,698],[185,701],[186,703],[186,706],[187,709],[187,712],[187,708],[187,704],[187,700]],[[136,230],[134,231],[131,232],[128,234],[126,236],[123,239],[121,240],[120,242],[118,244],[116,246],[115,248],[113,252],[112,254],[110,258],[108,260],[106,264],[104,267],[102,269],[101,271],[100,273],[98,275],[96,279],[95,282],[93,284],[92,288],[90,290],[89,293],[87,295],[86,298],[84,301],[81,305],[78,309],[77,312],[76,314],[74,318],[71,321],[68,325],[65,328],[63,331],[62,333],[60,336],[59,338],[57,341],[56,343],[55,346],[54,348],[52,350],[50,353],[48,356],[46,359],[45,361],[43,364],[42,367],[40,369],[39,372],[38,374],[36,376],[35,379],[34,382],[33,384],[32,386],[31,388],[30,391],[30,392]],[[139,244],[143,244],[146,245],[150,247],[152,248],[154,250],[156,252],[158,253],[162,255],[165,257],[168,259],[170,261],[172,263],[174,265],[176,266],[178,268],[181,271],[184,273],[186,274],[188,276],[190,278],[192,281],[194,283],[196,286],[199,289],[202,293],[205,296],[208,299],[210,301],[212,304],[215,306],[217,309],[220,311],[222,314],[225,317],[228,320],[230,323],[232,325],[235,328],[237,330],[240,333],[242,335],[245,338],[248,340],[250,343],[252,345],[253,348],[255,350],[257,352],[259,354],[260,356],[262,358],[265,361],[266,362],[269,365],[272,368],[275,371],[277,374],[279,375],[281,377],[282,379],[285,381],[287,383],[288,384],[290,386]],[[184,715],[182,716],[180,717],[177,719],[175,721],[173,722],[172,724],[170,726],[168,727],[166,729],[164,730],[162,732],[159,734],[157,736],[154,738],[151,740],[149,742],[146,744],[144,746],[141,748],[137,751],[136,752],[134,754],[131,756],[129,759],[126,762],[124,764],[123,766],[121,768],[119,770],[118,772],[116,775],[114,777],[112,779],[111,781],[110,782],[108,784],[106,786],[105,788],[104,790],[102,792],[100,794],[98,796],[97,797]],[[185,710],[187,712],[189,714],[191,716],[193,718],[195,720],[198,722],[200,723],[201,725],[203,726],[205,728],[207,730],[209,731],[211,732],[213,734],[214,736],[217,737],[219,739],[221,740],[224,742],[226,744],[228,746],[231,747],[233,749],[236,751],[239,753],[241,755],[243,757],[245,759],[247,760],[249,762],[251,763],[254,765],[257,768],[260,770],[262,772],[264,775],[267,778],[270,780],[272,782],[274,784],[275,786],[277,788],[279,790],[281,792],[282,792]]];
function drawFigure(ctx, x, y, s, a) {
  if (a <= 0.003) return;
  const k = (230 / 848) * s, ox = x - 173 * k, oy = y - 848 * k;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = COL.white; ctx.lineWidth = Math.max(1.5, 14 * k * 0.8); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const stroke of FIGURE) { ctx.beginPath(); stroke.forEach(([px, py], i) => (i ? ctx.lineTo(ox + px * k, oy + py * k) : ctx.moveTo(ox + px * k, oy + py * k))); ctx.stroke(); }
  ctx.restore();
}
function drawThought(ctx, x, y, w, h, text, p, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#2A3138'; ctx.strokeStyle = COL.white; ctx.lineWidth = 3.5;
  // the cloud: bumps around an ellipse
  const n = 14, bump = Math.min(26, h * 0.16); ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const t0 = (i / n) * Math.PI * 2, t1 = ((i + 1) / n) * Math.PI * 2, tm = (t0 + t1) / 2;
    const p0 = [x + (w / 2) * Math.cos(t0), y + (h / 2) * Math.sin(t0)], pm = [x + (w / 2 + bump) * Math.cos(tm), y + (h / 2 + bump) * Math.sin(tm)], p1 = [x + (w / 2) * Math.cos(t1), y + (h / 2) * Math.sin(t1)];
    if (!i) ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(pm[0] * 2 - (p0[0] + p1[0]) / 2, pm[1] * 2 - (p0[1] + p1[1]) / 2, p1[0], p1[1]);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  const k = Math.min(1, h / 180);
  for (const [dx, dy, r] of [[-w * 0.3, h * 0.62 + 10 * k, 14 * k], [-w * 0.38, h * 0.62 + 56 * k, 9 * k], [-w * 0.42, h * 0.62 + 90 * k, 5 * k]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (text) {
    const shown = text.slice(0, Math.ceil(text.length * clamp(p, 0, 1)));
    ctx.font = cm(Math.min(48, (w * 1.6) / Math.max(1, text.length))); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = COL.white;
    ctx.fillText(shown, x, y + 2);
  }
  ctx.restore();
}
// The magnifier over the beam: a ring on the beam marking the section, and a big circle beside it showing that
// section as the shadows scene draws it, particles wobbling and rays stopping at them.
function drawMagnifier(ctx, cam, B, m) {
  if (m <= 0.003) return;
  const e = smooth(m), q = cam.project(vAdd(B.b0, vMul(B.d, B.len * 0.52))) || [960, 560];
  const R = 235 * e, cx = lerp(q[0], 1400, e), cy = lerp(q[1], 262, e), r0 = 22;
  ctx.save(); ctx.globalAlpha = e;
  // the small ring on the beam and the two lines to the big circle
  ctx.strokeStyle = hexA(COL.white, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], r0, 0, Math.PI * 2); ctx.stroke();
  if (R > r0 + 10) {
    const d = Math.hypot(cx - q[0], cy - q[1]), ang = Math.atan2(cy - q[1], cx - q[0]), th = Math.acos(clamp((R - r0) / Math.max(d, 1e-6), -1, 1));
    ctx.setLineDash([6, 8]); ctx.beginPath();
    for (const s of [-1, 1]) { const a = ang + s * th; ctx.moveTo(q[0] + r0 * Math.cos(a), q[1] + r0 * Math.sin(a)); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  // inside: a window onto the middle of the shadows scene's slab, scaled so the slab's height fills the circle
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = hexA(BG, 0.93); ctx.fill();
  const k = (2 * R) / (SL.bot - SL.top), mx = (SL.x0 + SL.x1) / 2, my = (SL.top + SL.bot) / 2;
  ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-mx, -my);
  const sa = { ...SA, rays: '40' }, S = shadowsState(sa); drawShadowsPicture(ctx, 0, sa, S);
  ctx.restore();
  ctx.strokeStyle = COL.greyA; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
const presCv = document.createElement('canvas'), presCtx = presCv.getContext('2d');
function drawPresent(ctx, dt) {
  const st = PS;
  // the cloud, with the laser on and turning slowly; while it is the whole picture it draws straight onto the stage,
  // inside the aside it is drawn offscreen and shown in a card
  if (st.orbit && !reduced) SK.yaw = 0.62 + 0.16 * Math.sin(TIME * 0.11);
  const asideIn = smooth(clamp(st.aside, 0, 1)), asideOut = smooth(clamp(st.aside - 1, 0, 1)), cloudA = 1 - asideOut;
  if (cloudA > 0.003) {
    const cloud = (c) => { drawCloud3D(c, dt, SK); if (st.mag > 0.003) drawMagnifier(c, v3cam(SK), v3beam(SK), st.mag); };
    if (asideIn <= 0.003) cloud(ctx);
    else {
      if (presCv.width !== cv.width || presCv.height !== cv.height) { presCv.width = cv.width; presCv.height = cv.height; }
      const c = presCtx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.fillStyle = BG; c.fillRect(0, 0, presCv.width, presCv.height);
      c.setTransform(K, 0, 0, K, 0, 0); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.lineCap = 'butt'; c.setLineDash([]);
      cloud(c);
      const card = lerpRect([0, 0, W, H], [70, 150, 880, 495], asideIn);
      ctx.save(); ctx.globalAlpha = cloudA; ctx.beginPath(); ctx.roundRect(card[0], card[1], card[2], card[3], 14 * asideIn); ctx.clip();
      ctx.drawImage(presCv, card[0], card[1], card[2], card[3]); ctx.restore();
      if (asideIn > 0.003) { ctx.save(); ctx.globalAlpha = cloudA * asideIn; ctx.strokeStyle = COL.greyC; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(card[0], card[1], card[2], card[3], 14); ctx.stroke(); ctx.restore(); }
    }
  }
  // the figure and its thought: beside the card, then small in the corner once the equation takes the stage
  if (st.fig > 0.003) {
    const c = smooth(clamp(st.corner, 0, 1)), fx = lerp(1400, 150, c), fy = lerp(800, 1030, c), fs = lerp(1.9, 1, c), fa = smooth(clamp(st.fig, 0, 1));
    drawFigure(ctx, fx, fy, fs, fa);
    const tw = lerp(520, 150, c), th = lerp(180, 90, c), tx = fx + lerp(150, 110, c), ty = fy - lerp(610, 330, c);
    drawThought(ctx, tx, ty, tw, th, st.think, st.writeP, fa);
  }
  // the equation, its braces, and the question's box and caption
  if (st.eq) {
    const sp = peq(), a = 1;
    drawSprites(ctx, sp, { p: st.eqP, alpha: a, hi: st.hi, dim: st.dim });
    for (const b of st.braces) {
      if (b.a <= 0.003) continue;
      drawBrace(ctx, (b.x0 + b.x1) / 2, b.top, (b.x1 - b.x0) * b.g, b.h, b.th, b.color, Math.min(1, b.g * 4) * b.a);
      if (b.l > 0.003) for (const s of b.lab) drawSprite(ctx, shifted(s, 0, (1 - b.l) * 14), s.alpha * b.l * b.a, b.color);
    }
    if (st.hiTerm && st.box > 0.003) {
      const ss = sp.filter((s) => s.a.terms.includes(st.hiTerm));
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const s of ss) { const [l, r, t, b] = inkBox(s); x0 = Math.min(x0, l); x1 = Math.max(x1, r); y0 = Math.min(y0, t); y1 = Math.max(y1, b); }
      const pad = 16, bx = smooth(st.box);
      ctx.save(); ctx.strokeStyle = hexA(COL.yellow, bx); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.roundRect(x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad, 10); ctx.stroke(); ctx.restore();
      if (st.cap) drawTex(ctx, st.cap, 960, 820, 58, { p: st.capP, color: COL.yellow });
    }
  }
  // a small counter after each press, and a pause mark while paused
  const ta = PRES.paused ? 1 : clamp(1.8 - (TIME - PRES.toast), 0, 1);
  if (ta > 0.003) {
    ctx.save(); ctx.globalAlpha = ta; ctx.font = '500 22px ' + 'Inter, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = COL.grey;
    ctx.fillText(`${PRES.beat + 1} / ${BEATS.length} · ${BEATS[PRES.beat].name}${PRES.paused ? ' · paused' : ''}`, 28, H - 26); ctx.restore();
  }
}
