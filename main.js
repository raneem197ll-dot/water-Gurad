/* =====================================================================
   main.js — Water Guard UI (no dependencies)
   Sections: 1 utils · 2 header · 3 hero scroll · 4 reveal/counters
             5 video · 6 charts (problem) · 7 how stepper · 8 lab sim
             9 calculator · 10 sectors · 11 prototype · 12 misc
   ===================================================================== */
(() => {
'use strict';

/* ---------- 1. UTILS ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (x, a, b) => clamp((x - a) / (b - a));
const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('rm');
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
const COL = { aqua: '#2EC4A0', mint: '#8BE38F', coral: '#FF6A55', amber: '#F4C430', ice: '#EEF5F3', muted: '#8A9C98', line: 'rgba(255,255,255,.08)' };

/* ---------- 2. HEADER ---------- */
const header = $('#header'), nav = $('#nav'), pill = $('#navPill'), links = $$('a', nav), prog = $('#progress');
function movePill(a) {
  if (!a) { pill.style.opacity = 0; return; }
  const nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
  pill.style.width = r.width + 'px'; pill.style.transform = `translateX(${r.left - nr.left - 5}px)`; pill.style.left = '5px'; pill.style.opacity = 1;
}
let activeLink = null;
links.forEach(a => { a.addEventListener('mouseenter', () => movePill(a)); });
nav.addEventListener('mouseleave', () => movePill(activeLink));
const secIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  activeLink = links.find(a => a.getAttribute('href') === '#' + e.target.id) || null;
  links.forEach(a => a.classList.toggle('is-active', a === activeLink)); movePill(activeLink);
  $$('#drawer .dl').forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['top', 'intro', 'problem', 'solution', 'how', 'sectors', 'vision', 'calc', 'lab'].forEach(id => { const s = document.getElementById(id); s && secIO.observe(s); });
addEventListener('resize', () => movePill(activeLink));

// mobile drawer
const burger = $('#burger'), drawer = $('#drawer');
function setDrawer(open) {
  burger.setAttribute('aria-expanded', open); drawer.classList.toggle('is-open', open); drawer.setAttribute('aria-hidden', !open);
  $$('.dl', drawer).forEach((a, i) => a.style.transitionDelay = open ? (0.04 + i * 0.03) + 's' : '0s');
}
burger.addEventListener('click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
$$('a,button', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));
drawer.addEventListener('click', e => { if (e.target === drawer) setDrawer(false); });   // tap outside the sheet closes it
matchMedia('(min-width:1101px)').addEventListener('change', e => e.matches && setDrawer(false));
addEventListener('keydown', e => { if (e.key === 'Escape') { setDrawer(false); closeSheet(); } });

/* ---------- 3. 3D INTRO (scroll drives device3d.js via window.__heroP) ---------- */
const introUI = $('.intro__ui'), intro = $('.intro'), WD = (window.__drip = { state: 0, t0: 0 }), introFoot = $('.intro__foot'), title = $('#introTitle'), chapters = $$('.chapter'), veil = $('#veil'), hint = $('.hint'), introN = $('#introN'), introBar = $('#introBar');
let heroTarget = 0; window.__heroP = 0;
function introProgress() { const r = intro.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); }
function fadeBlock(el, a, b, p, f = 0.05) {
  const o = Math.min(a < 0 ? 1 : P(p, a, a + f), 1 - P(p, b - f, b));
  el.style.opacity = o; el.style.visibility = o > 0.01 ? 'visible' : 'hidden'; el.style.transform = `translateY(${(1 - o) * 24}px)`;
  el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
}
// "skip" + "enter" jump straight past the intro to the landing section
['#skipIntro', '#enterBtn'].forEach(sel => $(sel)?.addEventListener('click', e => { e.preventDefault(); document.getElementById('intro').scrollIntoView({ behavior: 'smooth' }); }));
// fast, eased jump to an element (used the moment the drop lands: no slow glide)
function rushTo(el, ms = 520) {
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const y0 = scrollY, y1 = el.getBoundingClientRect().top + scrollY - pad, t0 = performance.now();
  (function go(now) { const k = clamp((now - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    scrollTo({ top: y0 + (y1 - y0) * e, behavior: 'instant' }); if (k < 1) requestAnimationFrame(go); })(t0);
}
const DROP_HIT = 2.68;   // seconds from drip start to the drop touching the floor (matches device3d.js updateDrop)

/* ---------- master scroll/raf loop ---------- */
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${clamp(scrollY / Math.max(1, max))})`;
  header.classList.toggle('is-compact', scrollY > 40);
  $('#totop').classList.toggle('show', scrollY > innerHeight * 2);
  heroTarget = reduced ? 0 : introProgress();
  // once the drop starts to fall while scrolling down, carry the visitor into the site
  const raw = introProgress();
  if (raw > 0.93 && raw > lastRaw && !WD.state && !reduced) { WD.state = 1; WD.landed = false; WD.t0 = performance.now(); }
  if (raw < 0.75 || (WD.state === 2 && raw < 0.9)) WD.state = 0; lastRaw = raw;
}
let lastRaw = 0;
addEventListener('scroll', onScroll, { passive: true }); onScroll();
(function raf() {
  window.__heroP += (heroTarget - window.__heroP) * 0.075;   // slow, weighted scrub
  const p = window.__heroP;
  if (!reduced) {
    fadeBlock(title, -1, 0.16, p, 0.06);
    fadeBlock(chapters[0], 0.24, 0.52, p);
    fadeBlock(chapters[1], 0.6, 0.8, p);
    // end of the intro: the 3D drop (device3d.js) forms, falls, then the site opens
    const dt_ = WD.state ? (performance.now() - WD.t0) / 1000 : 0;
    if (WD.state === 1 && (WD.landed || dt_ >= DROP_HIT + 0.1)) { WD.state = 2; WD.landed = false; rushTo(document.getElementById('intro')); }   // the instant it hits the floor
    veil.style.opacity = WD.state ? P(dt_, DROP_HIT - 0.04, DROP_HIT + 0.3) : 0;
    introUI.style.setProperty('--shade', 1 - P(p, 0.8, 0.88));   // bottom shade leaves before the drop scene
    const step = p < 0.22 ? 1 : p < 0.58 ? 2 : 3; introN.textContent = '0' + step;
    introBar.style.transform = `scaleX(${p})`;
    hint.style.opacity = 1 - P(p, 0.01, 0.06);
    introFoot.style.opacity = 1 - P(p, 0.9, 0.98); introFoot.style.visibility = p > 0.985 ? 'hidden' : 'visible';   // skip/counter leave with the intro
  }
  requestAnimationFrame(raf);
})();
$('#totop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- 4. REVEAL + COUNTERS ---------- */
const onReveal = new Map();
const revIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; e.target.classList.add('in'); revIO.unobserve(e.target);
  (onReveal.get(e.target) || []).forEach(fn => fn());
}), { threshold: 0.18 });
$$('[data-reveal]').forEach(el => revIO.observe(el));
function whenSeen(el, fn) { if (!el) return; const host = el.closest('[data-reveal]') || el; if (host.classList.contains('in')) return fn(); onReveal.set(host, [...(onReveal.get(host) || []), fn]); if (!host.hasAttribute('data-reveal')) { host.setAttribute('data-reveal', ''); revIO.observe(host); } }
$$('[data-count]').forEach(el => whenSeen(el, () => {
  const to = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || ''; const t0 = performance.now();
  (function step(t) { const k = clamp((t - t0) / 1400); const e = 1 - Math.pow(1 - k, 3); el.textContent = pre + fmt(to * e) + suf; if (k < 1) requestAnimationFrame(step); })(t0);
}));

/* ---------- 6. helpers ---------- */
function linePath(pts) { return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '); }

/* ---------- 7. HOW — stepper with live illustration ---------- */
const steps = $$('#steps .step'), stageSvg = $('#stageSvg');
const STAGES = [   // original copy: title + description of each stage
  { t: 'قراءة مستمرة لتدفق المياه داخل الأنابيب', d: 'يقوم حساس التدفق النحاسي بقراءة سرعة تدفق الماء عبر مستشعر Hall Effect وتحويله إلى إشارات رقمية ترسل لمعالج ESP32 لحظياً.', chip: 'FLOW 2.4 L/m' },
  { t: 'حساب ومعرفة نمط الاستهلاك الطبيعي', d: 'يقوم النظام بحساب متوسط الاستهلاك في أوقات الذروة وأوقات النوم، مما يمنحه القدرة على معرفة النمط الخاص بكل منشأة أو شقة.', chip: 'BASELINE 24h' },
  { t: 'رصد أي استهلاك غير طبيعي أو زيادة غير معتادة', d: 'إذا استمر تدفق الماء لأكثر من المدة المسموح بها في وقت السكون (مثلاً تدفق مستمر لأكثر من 30 دقيقة فجراً)، يصنف فوراً كتسرب نشط.', chip: '02:15 • 7.6 L/m' },
  { t: 'إرسال إشعار فوري وتفعيل صمام الأمان', d: 'إرسال إشعار فوري إلى هاتف المستخدم يحدد موقع التسرب، مع إمكانية إغلاق الصمام الذكي تلقائياً لمنع غرق المبنى.', chip: 'VALVE CLOSED • 4s' }];
function drawStage(i) {
  const s = stageSvg; s.innerHTML = ''; s.classList.remove('fade-swap'); void s.offsetWidth; s.classList.add('fade-swap');
  $('#stageTitle').textContent = STAGES[i].t; $('#stageChip').textContent = STAGES[i].chip; $('#stageDesc').textContent = STAGES[i].d;
  const g = svgEl('g', {}, s);
  if (i === 0) { // pipe + pulses
    svgEl('rect', { x: 40, y: 70, width: 520, height: 60, rx: 30, fill: 'rgba(46,196,160,.12)', stroke: 'rgba(46,196,160,.5)' }, g);
    for (let k = 0; k < 9; k++) { const c = svgEl('circle', { cx: 60 + k * 60, cy: 100, r: 7, fill: COL.aqua }, g); c.innerHTML = `<animate attributeName="cx" from="${60 + k * 60}" to="${120 + k * 60}" dur="1s" repeatCount="indefinite"/>`; }
    svgEl('circle', { cx: 300, cy: 100, r: 40, fill: '#0F1C1A', stroke: '#F4C430', 'stroke-width': 6 }, g);
    const tb = svgEl('g', {}, g); for (let k = 0; k < 6; k++) svgEl('rect', { x: 297, y: 66, width: 6, height: 34, rx: 3, fill: '#F4C430', transform: `rotate(${k * 60} 300 100)` }, tb);
    tb.innerHTML += '<animateTransform attributeName="transform" type="rotate" from="0 300 100" to="360 300 100" dur="1.2s" repeatCount="indefinite"/>';
    let d = 'M40 260'; for (let k = 0; k < 14; k++) { const x = 40 + k * 37; d += ` L${x} 260 L${x} 210 L${x + 18} 210 L${x + 18} 260`; } d += ' L560 260';
    svgEl('path', { d, fill: 'none', stroke: COL.mint, 'stroke-width': 3 }, g);
    svgEl('text', { x: 300, y: 300, 'text-anchor': 'middle', fill: COL.muted, 'font-size': 14, 'font-family': 'Noto Kufi Arabic' }, g).textContent = 'دوران التوربين ← نبضات رقمية (Hall Effect) ← معالج ESP32';
  } else {
    const X = h => 40 + h / 24 * 520, Y = v => 290 - v / 9 * 250;
    svgEl('rect', { x: X(0), y: 40, width: X(5) - X(0), height: 250, fill: 'rgba(244,196,48,.08)', rx: 10 }, g);
    svgEl('text', { x: X(2.5), y: 60, 'text-anchor': 'middle', fill: '#CAD5D2', 'font-size': 13, 'font-family': 'Noto Kufi Arabic' }, g).textContent = 'ساعات السكون';
    [0, 6, 12, 18, 24].forEach(h => svgEl('text', { x: X(h), y: 320, 'text-anchor': 'middle', fill: COL.muted, 'font-size': 12, 'font-family': 'JetBrains Mono' }, g).textContent = String(h).padStart(2, '0') + ':00');
    const base = h => 0.3 + 5.5 * Math.exp(-Math.pow((h - 7) / 1.2, 2)) + 3 * Math.exp(-Math.pow((h - 13) / 1.6, 2)) + 4.6 * Math.exp(-Math.pow((h - 20.5) / 1.5, 2));
    const pts = []; for (let h = 0; h <= 24; h += 0.25) pts.push([X(h), Y(base(h))]);
    const bp = svgEl('path', { d: linePath(pts), fill: 'none', stroke: COL.mint, 'stroke-width': 3, 'stroke-dasharray': i === 1 ? '0' : '7 6' }, g);
    if (i === 1) { const len = bp.getTotalLength(); bp.style.strokeDasharray = len; bp.style.strokeDashoffset = len; requestAnimationFrame(() => { bp.style.transition = 'stroke-dashoffset 2s ease'; bp.style.strokeDashoffset = 0; });
      svgEl('text', { x: X(16), y: Y(6.5), fill: '#DDF8DE', 'font-size': 14, 'font-family': 'Noto Kufi Arabic', 'font-weight': 600 }, g).textContent = 'النمط المرجعي لبيتك'; }
    if (i >= 2) {
      svgEl('line', { x1: 40, x2: 560, y1: Y(6), y2: Y(6), stroke: COL.coral, 'stroke-dasharray': '6 6', opacity: .6 }, g);
      const lp = []; for (let h = 2.25; h <= (i === 2 ? 5 : 2.6); h += 0.05) lp.push([X(h), Y(7.6 + Math.sin(h * 9) * .2)]);
      svgEl('path', { d: `M${X(2.25)} ${Y(base(2.25))} ` + linePath(lp).replace('M', 'L'), fill: 'none', stroke: COL.coral, 'stroke-width': 4 }, g);
      const c = svgEl('circle', { cx: X(2.25), cy: Y(7.6), r: 9, fill: COL.coral }, g);
      c.innerHTML = '<animate attributeName="r" values="9;20;9" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.3;1" dur="1.2s" repeatCount="indefinite"/>';
      svgEl('text', { x: X(2.25) + 26, y: Y(7.6) - 18, fill: '#FFB8AA', 'font-size': 14, 'font-family': 'Noto Kufi Arabic', 'font-weight': 600, 'text-anchor': 'start' }, g).textContent = i === 2 ? '02:15 • تدفق مستمر 45 دقيقة!' : '';
    }
    if (i === 3) {
      const card = svgEl('g', { transform: 'translate(250 120)' }, g);
      svgEl('rect', { width: 300, height: 120, rx: 22, fill: '#13201E', stroke: 'rgba(255,106,85,.6)' }, card);
      svgEl('text', { x: 280, y: 36, fill: '#FFCBBF', 'font-size': 16, 'font-family': 'Noto Kufi Arabic', 'font-weight': 600, 'text-anchor': 'end' }, card).textContent = '⚠ تم رصد تسرب نشط';
      svgEl('text', { x: 280, y: 64, fill: '#C2D0CC', 'font-size': 13.5, 'font-family': 'Noto Kufi Arabic', 'text-anchor': 'end' }, card).textContent = 'شقة 2 • الدور الثالث • دورة المياه';
      svgEl('rect', { x: 20, y: 80, width: 260, height: 28, rx: 14, fill: 'rgba(139,227,143,.15)', stroke: 'rgba(139,227,143,.5)' }, card);
      svgEl('text', { x: 150, y: 99, fill: '#DDF8DE', 'font-size': 13, 'font-family': 'Noto Kufi Arabic', 'text-anchor': 'middle' }, card).textContent = '✓ تم إغلاق الصمام خلال 4 ثوانٍ';
    }
  }
}
let stepIdx = 0, stepAuto = true, stepT0 = performance.now(), stepSeen = false;
function setStep(i, user) {
  stepIdx = i; steps.forEach((s, k) => { s.classList.toggle('on', k === i); s.setAttribute('aria-selected', k === i); $('.step__bar', s).style.transform = 'scaleX(0)'; });
  drawStage(i); stepT0 = performance.now(); if (user) stepAuto = false;
}
steps.forEach((s, i) => s.addEventListener('click', () => setStep(i, true)));
drawStage(0);
new IntersectionObserver(([e]) => stepSeen = e.isIntersecting, { threshold: .3 }).observe($('#how'));
(function stepLoop(t) {
  if (stepAuto && stepSeen && !reduced) { const k = clamp((t - stepT0) / 5200); $('.step__bar', steps[stepIdx]).style.transform = `scaleX(${k})`; if (k >= 1) setStep((stepIdx + 1) % 4); }
  requestAnimationFrame(stepLoop);
})(performance.now());

/* ---------- 8. LAB — live simulation ---------- */
const sim = { run: false, mode: 'normal', flow: 2.4, total: 125.4, saved: 0, alerts: 0, overTicks: 0, minute: 2 * 60 + 10, closedByLeak: false, series: [], alerted: false };
for (let i = 0; i < 40; i++) sim.series.push(2.3 + Math.random() * 0.2); sim.state = 'مراقبة مستمرة - تدفق طبيعي';
const statusChip = $('#statusChip'), statusTxt = $('#statusTxt');
const clockStr = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function log(msg, cls = '') { const l = $('#log'); if (!l) return; l.insertAdjacentHTML('afterbegin', `<div><span class="mono">${clockStr(sim.minute)}</span><span class="${cls}">${msg}</span></div>`); while (l.children.length > 12) l.lastChild.remove(); }
function guide(n) { $$('#guide .chip').forEach(c => { if (+c.dataset.g <= n) c.classList.add('done'); }); }
function setStatus(kind, txt) { statusChip.classList.toggle('is-leak', kind === 'leak'); statusChip.classList.toggle('is-closed', kind === 'closed'); statusTxt.textContent = txt; }
function renderSim() {
  const s = sim, bad = s.mode === 'leak' && s.overTicks >= 3;
  $('#oled').innerHTML = `<b>WATER GUARD | حارس المياه</b><br>معدل التدفق: ${s.flow.toFixed(1)} لتر/دقيقة<br>إجمالي الاستهلاك: ${s.total.toFixed(1)} لتر<br>` +
    (s.mode === 'closed' ? `<span style="color:#C4F2C6">حالة النظام: الصمام مغلق [أمان]</span>` : bad ? `<span class="bad">حالة النظام: تم اكتشاف تسرب نشط !</span>` : s.mode === 'high' ? `<span style="color:#FFE08A">حالة النظام: استهلاك مرتفع غير معتاد</span>` : `حالة النظام: مراقبة مستمرة`);
  $('#mState').textContent = s.state; $('#mState').className = s.mode === 'closed' ? 't-aqua' : bad ? 't-coral' : s.mode === 'high' ? 't-amber' : 't-mint';
  $('#ledR').classList.toggle('on', bad); $('#ledG').classList.toggle('on', !bad);
  $('#mFlow').textContent = s.flow.toFixed(1); $('#mTotal').textContent = fmt(s.total, 1); $('#mSaved').textContent = fmt(s.saved, 0); $('#mAlerts').textContent = s.alerts;
  const vt = $('#valveTxt'); vt.textContent = s.mode === 'closed' ? 'مغلق كهروميكانيكياً (أمان)' : 'مفتوح (تدفق نشط)'; vt.className = s.mode === 'closed' ? 't-aqua' : bad ? 't-coral' : 't-mint';
  $('#simClose').textContent = s.mode === 'closed' ? 'إعادة فتح الصمام' : 'إغلاق الصمام الذكي فورًا'; $('#simRun').textContent = s.run ? 'إيقاف مؤقت' : 'تشغيل المحاكاة';
  drawSimChart();
}
function tick() {
  const s = sim; if (!s.run) return; s.minute++;
  const target = s.mode === 'leak' ? 7.6 : s.mode === 'high' ? 12.5 : s.mode === 'closed' ? 0 : 2.4;
  s.flow += (target - s.flow) * 0.45 + (s.mode === 'closed' ? 0 : (Math.random() - 0.5) * 0.25); s.flow = Math.max(0, s.flow);
  s.total += s.flow; s.series.push(s.flow); if (s.series.length > 40) s.series.shift();
  if (s.mode === 'closed' && s.closedByLeak) s.saved += 7.6;
  if (s.mode === 'leak') { s.overTicks += s.flow > 6 ? 1 : 0; if (s.overTicks === 3 && !s.alerted) { s.alerted = true; s.alerts++; s.state = 'تم اكتشاف تسرب نشط في الشبكة!'; log('«تحذير! تم اكتشاف تسرب في شبكة المياه»', 't-coral'); toast('تم رصد تدفق مستمر غير اعتيادي خارج النمط المرجعي. اضغط على إغلاق الصمام الذكي لحماية العقار.'); setStatus('leak', 'إنذار فوري'); openSheet(); guide(2); } }
  renderSim();
}
let simTimer = null;
const simIO = new IntersectionObserver(([e]) => { clearInterval(simTimer); simTimer = e.isIntersecting ? setInterval(tick, 650) : null; }, { threshold: .15 });
simIO.observe($('#lab'));
const startSim = () => { sim.run = true; renderSim(); };
$('#simRun').addEventListener('click', () => { sim.run = !sim.run; renderSim(); });
$('#simLeak').addEventListener('click', () => { startSim(); Object.assign(sim, { mode: 'leak', overTicks: 0, alerted: false, closedByLeak: false, state: 'مراقبة مستمرة - تدفق طبيعي' }); log('بدأ تدفق غير اعتيادي (اكتشاف تسرب)', 't-amber'); setStatus('normal', 'مراقبة مستمرة'); });
$('#labGo').addEventListener('click', () => $('#simLeak').click());
$('#simHigh').addEventListener('click', () => { startSim(); Object.assign(sim, { mode: 'high', state: 'استهلاك مرتفع غير معتاد' }); log('«تم رصد ارتفاع غير معتاد في استهلاك المياه»', 't-amber'); toast('معدل التدفق تجاوز 12 لتر/دقيقة. يرجى التحقق من صنبور مفتوح أو تعبئة مستمرة.'); setStatus('normal', 'استهلاك مرتفع'); });
function closeValve() { const wasLeak = sim.mode === 'leak'; Object.assign(sim, { mode: 'closed', closedByLeak: wasLeak, state: 'تم إغلاق الصمام الذكي لحماية العقار' }); log('تم إغلاق الصمام الذكي لحماية العقار ✓', 't-mint'); setStatus('closed', 'صمام مغلق [أمان]'); closeSheet(); renderSim(); }
function openValve() { Object.assign(sim, { mode: 'normal', overTicks: 0, alerted: false, state: 'مراقبة مستمرة - تدفق طبيعي' }); log('إعادة فتح الصمام'); setStatus('normal', 'مراقبة مستمرة'); renderSim(); }
$('#simClose').addEventListener('click', () => sim.mode === 'closed' ? openValve() : closeValve()); $('#sheetClose').addEventListener('click', closeValve);
$('#simReset').addEventListener('click', () => { Object.assign(sim, { mode: 'normal', overTicks: 0, alerted: false, state: 'مراقبة مستمرة - تمت إعادة المعايرة' }); log('مراقبة مستمرة - تمت إعادة المعايرة'); setStatus('normal', 'مراقبة مستمرة'); renderSim(); });
$('#sheetDismiss').addEventListener('click', () => { closeSheet(); Object.assign(sim, { mode: 'normal', overTicks: 0, alerted: false, state: 'مراقبة مستمرة - تدفق طبيعي' }); setStatus('normal', 'مراقبة مستمرة'); log('تأكيد الاستهلاك وتأجيل الإنذار'); });
function openSheet() { $('#sheet').classList.add('is-open'); $('#sheetClose').focus({ preventScroll: true }); }
function closeSheet() { $('#sheet').classList.remove('is-open'); }
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });

function drawSimChart() {
  const cv = $('#simChart'), r = cv.getBoundingClientRect(); if (!r.width) return;
  const d = Math.min(devicePixelRatio || 1, 2); if (cv.width !== Math.round(r.width * d)) { cv.width = r.width * d; cv.height = r.height * d; }
  const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); const W = r.width, H = r.height, L = 34, B = H - 22, T = 10;
  c.clearRect(0, 0, W, H); const Y = v => B - v / 14 * (B - T), X = i => L + i / 39 * (W - L - 6);
  c.font = '11px JetBrains Mono'; c.fillStyle = COL.muted; c.strokeStyle = COL.line; c.lineWidth = 1;
  [0, 4, 8, 12].forEach(v => { c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(W, Y(v)); c.stroke(); c.fillText(v, 6, Y(v) + 4); });
  const dash = (v, col) => { c.setLineDash([6, 6]); c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(W, Y(v)); c.stroke(); c.setLineDash([]); };
  dash(2.4, COL.mint); dash(6, COL.coral);
  const s = sim.series, bad = sim.mode === 'leak' && sim.overTicks >= 3, col = bad ? COL.coral : sim.mode === 'high' ? COL.amber : COL.aqua;
  const gr = c.createLinearGradient(0, T, 0, B); gr.addColorStop(0, col + '55'); gr.addColorStop(1, col + '00');
  c.beginPath(); s.forEach((v, i) => { const x = X(i), y = Y(v); if (!i) c.moveTo(x, y); else { const px = X(i - 1), py = Y(s[i - 1]); c.bezierCurveTo((px + x) / 2, py, (px + x) / 2, y, x, y); } });
  c.lineTo(X(s.length - 1), B); c.lineTo(X(0), B); c.closePath(); c.fillStyle = gr; c.fill();
  c.beginPath(); s.forEach((v, i) => { const x = X(i), y = Y(v); if (!i) c.moveTo(x, y); else { const px = X(i - 1), py = Y(s[i - 1]); c.bezierCurveTo((px + x) / 2, py, (px + x) / 2, y, x, y); } });
  c.strokeStyle = col; c.lineWidth = 3; c.shadowColor = col; c.shadowBlur = 12; c.stroke(); c.shadowBlur = 0;
  const lx = X(s.length - 1), ly = Y(s[s.length - 1]); c.fillStyle = col; c.beginPath(); c.arc(lx, ly, 5, 0, 7); c.fill();
}
addEventListener('resize', drawSimChart);
log('مراقبة مستمرة - تدفق طبيعي'); renderSim();

/* ---------- 9. CALCULATOR (original: facility type × water points) ---------- */
function rangeFill(el) { const p = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--p', p + '%'); }
const BASE = { villa: [8500, 'فيلا'], apartment: [4200, 'شقة'], commercial: [18000, 'تجاري'], factory: [45000, 'مصنع'] };
function calcFac() {
  const type = $('#fType').value, pts = +$('#fPoints').value; $('#oPoints').textContent = pts; rangeFill($('#fPoints'));
  const L = k => Math.round(BASE[k][0] * pts * 0.32 * 12); const lit = L(type);
  $('#fL').textContent = fmt(lit); $('#fS').textContent = fmt(lit / 1000 * 6);
  const s = $('#facChart'); s.innerHTML = ''; const keys = Object.keys(BASE); const max = L('factory') * 1.05;
  keys.forEach((k, i) => { const y = 20 + i * 52, w = L(k) / max * 380, on = k === type;
    svgEl('text', { x: 548, y: y + 22, 'text-anchor': 'end', fill: on ? '#fff' : COL.muted, 'font-size': 14, 'font-family': 'Noto Kufi Arabic', 'font-weight': on ? 600 : 400 }, s).textContent = BASE[k][1];
    svgEl('rect', { x: 470 - 380, y: y + 6, width: 380, height: 24, rx: 12, fill: 'rgba(255,255,255,.05)' }, s);
    svgEl('rect', { x: 470 - w, y: y + 6, width: w, height: 24, rx: 12, fill: on ? COL.aqua : 'rgba(46,196,160,.3)' }, s);
    svgEl('text', { x: 470 - w - 8, y: y + 23, 'text-anchor': 'end', fill: on ? '#fff' : COL.muted, 'font-size': 12, 'font-family': 'JetBrains Mono' }, s).textContent = fmt(L(k) / 1000 * 6) + ' SAR'; });
}
$('#fType').addEventListener('change', calcFac); $('#fPoints').addEventListener('input', calcFac); calcFac();

/* ---------- 10. SECTORS ---------- */
const SECTORS = [   // original copy (polite wording: خزان الطرد / الاستحمام)
  { img: 'bathroom', h: 'التوزيع السكني: الحماية الشاملة لدورات المياه', sub: 'حماية بنقطة واحدة',
    p: 'يُركب جهاز «حارس المياه» في نقطة التمركز الاستراتيجية على الماسورة الأساسية في بداية دخول المياه للحمام وقبل أي تفرع، وبفضل هذا التمركز، أي تسريب يحدث في مكان داخلي مخفي (المغسلة، خزان الطرد، أو الاستحمام) يتم رصده فوراً وتحديده كاستهلاك غير طبيعي لهذه الدورة المحددة.',
    pts: [['نقطة التمركز الاستراتيجية', 'على الخط الرئيسي قبل أي تفرع داخل الجدار'], ['مسارات التوزيع الفرعية', 'حماية متزامنة للمغسلة وخزان الطرد والاستحمام'], ['حماية بنقطة واحدة', 'رصد وحصر التسرب بدقة متناهية دون تكسير عشوائي']] },
  { img: 'building_construction', dash: 'dash_construction', h: 'المباني قيد الإنشاء: ذكاء البيانات وتحديد الموقع', sub: 'تأسيس ذكي مبكر',
    p: 'يُدمج الجهاز بسهولة في مرحلة تأسيس السباكة، مما يضمن حماية مبكرة وشاملة للبنية التحتية، ويتيح إرسال تنبيهات ذكية عالية الدقة تحدد رقم الشقة والدور والغرفة المصابة (مثال: شقة رقم 2، الدور الثالث، دورة المياه).',
    q: '«تنبيه ذكي وعالي الدقة: نوع الحدث: تدفق مستمر غير اعتيادي | وقت البداية: 02:15 صباحاً | الموقع الدقيق: شقة 2، الدور 3»' },
  { img: 'existing', h: 'المباني القائمة: آلية التركيب والتحديث', sub: 'بدون تكسير جدران',
    p: 'يتم تركيب النظام في المباني القائمة وفق هيكلة المبنى بشكل منظم، بجوار الخزان الأرضي والعداد الرئيسي والمضخات العلوية، مما يمنح المباني القديمة نفس الذكاء والحماية الرقمية المتطورة دون الحاجة لتعديل شبكة المواسير الداخلية.' },
  { img: 'factory', dash: 'factory_dash', h: 'القطاع الصناعي: كفاءة الإنتاج في المصانع', sub: 'شبكة إنترنت أشياء مترابطة',
    p: 'بدلاً من جهاز واحد، يتم نشر شبكة مترابطة من أجهزة حارس المياه كبوابات قياس بين كل مرحلة إنتاج وأخرى (منطقة السحب، منطقة المعالجة والفلترة، خطوط التعبئة، وخزانات التخزين) لرصد أي تسريب بين الأنابيب الصناعية على الفور.' }];
function setSector(i) {
  const s = SECTORS[i]; $$('#secTabs button').forEach((b, k) => b.setAttribute('aria-selected', k === i));
  const img = $('#secImg'); img.src = `media/${s.img}_n.webp`; img.alt = s.h;
  $('#secDash').hidden = !s.dash; if (s.dash) { $('#secDashImg').src = `media/${s.dash}.webp`; $('#secDashImg').alt = s.h; }
  $('#secBody').innerHTML = `<h3>${s.h}</h3><span class="sec-sub">${s.sub}</span><p>${s.p}</p>` +
    (s.pts ? `<ol class="sec-pts">${s.pts.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('')}</ol>` : '') + (s.q ? `<div class="quote">${s.q}</div>` : '');
  const box = $('#sector'); box.classList.remove('fade-swap'); void box.offsetWidth; box.classList.add('fade-swap');
}
$$('#secTabs button').forEach((b, i) => b.addEventListener('click', () => setSector(i))); setSector(0);

/* ---------- 10b. EXPLORER toolbar + info card ---------- */
const EX = [   // original component names + roles; the relay is our addition
  ['01', 'صندوق الحماية المعزول IP65', 'غلاف بولي كربونات أبيض مقاوم للرطوبة والمياه مع غطاء أكريليك فائق الشفافية ومسامير تثبيت فولاذية', ['IP65 Rated', 'Transparent UV-stabilized lid', 'PG7 cable glands']],
  ['02', 'وحدة المعالجة ESP32 Microcontroller', 'العقل المدبر للنظام: يحلل نبضات حساس التدفق ويشغل خوارزمية التعلم للتسربات ويتصل بشبكة الواي فاي', ['Dual-Core 240MHz', 'Wi-Fi & Bluetooth 4.2', 'Hardware Pulse Counter']],
  ['03', 'شاشة العرض الرقمية OLED 0.96"', 'تعرض معدل التدفق اللحظي، الاستهلاك التراكمي، وحالة النظام والإنذار باللغة العربية والإنجليزية', ['128x64 px SSD1306', 'I2C (SCL, SDA)']],
  ['04', 'مستشعر تدفق المياه النحاسي YF-S201', 'يحول دوران التوربين الداخلي بفعل جريان الماء إلى نبضات كهربائية دقيقة ترصد أي تدفق خفي', ['1 - 30 L/min', 'F = 7.5 * Q (L/min)', 'Solid Brass body']],
  ['05', 'صمام القطع الذكي الكهروميكانيكي', 'يغلق خط المياه تلقائياً وفورياً عند تأكيد تسرب مائي لمنع غرق المبنى وتصدع الجدران', ['5V - 12V DC', '90° closure', 'Zero water hammer risk']],
  ['06', 'مرحّل الصمام', 'يستقبل إشارة المعالج من المنفذ G26 ويشغّل محرك الصمام.', ['IN ← G26', 'COM / NO → valve']],
];
// wiring legend shown in the info card while wiring mode is on (colours = 3D wires = diagram)
const WIRES = [['#5BC0FF', 'SDA · G21', '→ شاشة OLED'], ['#FFC94A', 'SCL · G22', '→ شاشة OLED'], ['#2EC4A0', 'G27', '← نبضات حساس التدفق'], ['#2EC4A0', 'G26', '→ مرحّل الصمام'],
  ['#8BE38F', 'G15 · G2 · G4', '→ مؤشرات LED'], ['#FF5A4A', 'VIN · 5V · 3V3', 'تغذية'], ['#5E706C', 'GND', 'أرضي مشترك']];
window.__exSelect = i => {
  const [n, t, d, sp] = EX[i]; $('#exInfo').classList.add('show'); $('#exN').textContent = n; $('#exT').textContent = t; $('#exD').textContent = d;
  $('#exS').innerHTML = sp.map(x => `<span class="chip">${x}</span>`).join('');
  $$('#exLabels .lbl3d').forEach((el, k) => el.classList.toggle('on', k === i)); $('#exHint').style.opacity = 0;
};
const exCall = (fn, ...a) => window.__explorer && window.__explorer[fn](...a);
$('#exIn')?.addEventListener('click', () => exCall('zoom', 0.7));
$('#exOut')?.addEventListener('click', () => exCall('zoom', 1.4));
$('#exExplode')?.addEventListener('click', e => { if ($('#exWire')?.classList.contains('is-on')) { exCall('wiring', false); wireUI(false); } const on = exCall('toggleExplode'); e.currentTarget.textContent = on ? 'تركيب القطع' : 'عرض مفكك'; });
// wiring legend lives in its own panel under the 3D view (never on top of the model)
$('#wireList').innerHTML = WIRES.map(([c, p, d]) => `<div class="wire-row" style="--c:${c}"><i></i><b>${p}</b><span>${d}</span></div>`).join('');
const wireUI = on => { const b = $('#exWire'); if (!b) return; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); b.textContent = on ? 'إخفاء الأسلاك' : 'الأسلاك';
  $('#wireMap').classList.toggle('open', on); if (!on) return; $('#exInfo').classList.remove('show'); $('#exHint').style.opacity = 0;
  if (matchMedia('(max-width:980px)').matches) setTimeout(() => $('#wireMap').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 420); };
$('#exWire')?.addEventListener('click', () => { const on = exCall('wiring', !$('#exWire').classList.contains('is-on')); wireUI(!!on); $('#exExplode').textContent = 'عرض مفكك'; });
$('#exReset')?.addEventListener('click', () => { exCall('reset'); $('#exInfo').classList.remove('show'); $('#exExplode').textContent = 'عرض مفكك'; wireUI(false); });

/* ---------- 11. ENGINEERING SPECS (original) + modals ---------- */
const COMPS = [
  ['ESP32', 'وحدة المعالجة ESP32 Microcontroller', 'العقل المدبر للنظام: يحلل نبضات حساس التدفق ويشغل خوارزمية التعلم للتسربات ويتصل بشبكة الواي فاي', ['Tensilica Xtensa Dual-Core 240MHz', 'Built-in 2.4GHz Wi-Fi & Bluetooth 4.2', 'Ultra-low power deep sleep modes', 'Hardware Timer Pulse Counter']],
  ['OLED', 'شاشة العرض الرقمية OLED 0.96"', 'تعرض معدل التدفق اللحظي، الاستهلاك التراكمي، وحالة النظام والإنذار باللغة العربية والإنجليزية', ['Resolution: 128x64 px SSD1306', 'I2C Interface (SCL, SDA)', 'High contrast ratio in bright ambient light', 'Fast 400kHz bus telemetry refresh']],
  ['FLOW', 'مستشعر تدفق المياه النحاسي YF-S201', 'يحول دوران التوربين الداخلي بفعل جريان الماء إلى نبضات كهربائية دقيقة ترصد أي تدفق خفي', ['Working Range: 1 - 30 L/min', 'Burst Pressure: 1.75 MPa', 'Pulse Factor: F = 7.5 * Q (L/min)', 'Solid Brass body for corrosion resistance']],
  ['VALVE', 'صمام القطع الذكي الكهروميكانيكي', 'يغلق خط المياه تلقائياً وفورياً عند تأكيد تسرب مائي لمنع غرق المبنى وتصدع الجدران', ['Operating Voltage: 5V - 12V DC', 'Full closure angle: 90 degrees', 'Manual override switch', 'Zero water hammer risk']],
  ['IP65', 'صندوق الحماية المعزول IP65', 'غلاف بولي كربونات أبيض مقاوم للرطوبة والمياه مع غطاء أكريليك فائق الشفافية ومسامير تثبيت فولاذية', ['Ingress Protection: IP65 Rated', 'Transparent UV-stabilized lid', 'Vibration-damping pipe mounts', 'Internal PG7 cable glands']]];
const openModal = id => { const m = $('#m-' + id); if (!m) return; m.hidden = false; requestAnimationFrame(() => m.classList.add('is-open')); $('[data-close]', m).focus({ preventScroll: true }); };
const closeModals = () => $$('.modal.is-open').forEach(m => { m.classList.remove('is-open'); setTimeout(() => m.hidden = true, 250); });
$$('[data-open]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.open)));
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModals(); }));
addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });
$('#comps').innerHTML = COMPS.map(([ic, n, r, sp], i) => `<details class="comp"${i === 0 ? ' open' : ''}><summary><span class="ic mono" style="font-size:10px;color:var(--aqua)">${ic}</span><span><b>${n}</b><small>${r}</small></span></summary><div class="body">${sp.map(x => `<span class="chip">${x}</span>`).join('')}</div></details>`).join('');

})();
