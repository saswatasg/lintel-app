/* Lintel landing page */
(() => {
'use strict';

// When Lintel is live on the Mac App Store, put its link here and every download button switches over.
const STORE_URL = '';
// Until then, "Notify me at launch" sends the email to this Kit form (the action URL from Kit's HTML embed).
const KIT_ACTION = 'https://app.kit.com/forms/10245732/subscriptions';
const PRE = !STORE_URL && !!KIT_ACTION;
if (PRE) document.documentElement.classList.add('pre');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const graphemes = s => (window.Intl && Intl.Segmenter)
  ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].map(x => x.segment)
  : Array.from(s);
const onView = (el, on, off, threshold = .3) =>
  new IntersectionObserver(es => es.forEach(e => { const f = e.isIntersecting ? on : off; if (f) f(); }), { threshold }).observe(el);
const ic = (id, style = '') => `<svg class="ic"${style ? ` style="${style}"` : ''}><use href="#i-${id}"/></svg>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- notices ---------- */
const toast = document.createElement('div');
toast.className = 'toast'; toast.setAttribute('role', 'status');
document.body.appendChild(toast);
let toastT = 0;
function say(msg) {
  toast.textContent = msg; toast.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 3200);
}

/* ---------- download buttons and the launch sign-up ---------- */
function focusNotify() {
  const hero = $('#nHero'), end = $('#nEnd');
  const target = !hero.closest('.notify').classList.contains('done') && scrollY < innerHeight * 1.2 ? hero
    : !end.closest('.notify').classList.contains('done') ? end : null;
  if (!target) { say('You’re on the list. We’ll email you the day Lintel is on the Mac App Store.'); return; }
  target.closest('.notify').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  setTimeout(() => target.focus({ preventScroll: true }), reduce ? 0 : 500);
}
$$('[data-cta]').forEach(a => {
  const pre = a.querySelector('[data-cta-pre]');
  if (STORE_URL) {
    a.href = STORE_URL; a.rel = 'noopener';
    if (pre) pre.textContent = 'Download on the';
    if (a.dataset.ctaLabel) a.textContent = a.dataset.ctaLabel;
  } else if (PRE) {
    if (a.dataset.ctaLabel) a.textContent = 'Notify me at launch';
    a.addEventListener('click', e => { e.preventDefault(); focusNotify(); });
  } else if (a.dataset.ctaLabel || a.closest('#pricing')) {
    a.addEventListener('click', e => { e.preventDefault(); say('Lintel is in Apple’s review now and arrives on the Mac App Store soon.'); });
  }
});
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DONE_KEY = 'lintel-notify';
const okText = 'Almost there: check your inbox and confirm your email. We’ll write once, the day Lintel is on the Mac App Store.';
function showMsg(form, kind, text) {
  const m = form.closest('.ctas').nextElementSibling;
  if (!m || !m.hasAttribute('data-msg')) return;
  m.className = 'nmsg ' + kind;
  m.innerHTML = (kind === 'ok' ? ic('circle-check') : '') + esc(text);
}
function markDone(text) { $$('[data-notify]').forEach(f => { f.classList.add('done'); showMsg(f, 'ok', text); }); }
try { if (PRE && localStorage.getItem(DONE_KEY)) markDone('You’re on the list. We’ll email you the day Lintel is on the Mac App Store.'); } catch (e) { /* storage blocked */ }
if (location.hash === '#confirmed') {
  history.replaceState(null, '', location.pathname + location.search);
  try { localStorage.setItem(DONE_KEY, '1'); } catch (e) { /* storage blocked */ }
  if (PRE) markDone('You’re confirmed. We’ll email you the day Lintel is on the Mac App Store.');
  setTimeout(() => say('You’re confirmed. We’ll email you the day Lintel is on the Mac App Store.'), 600);
}
async function subscribe(email) {
  const body = new URLSearchParams({ email_address: email });
  try {
    const r = await fetch(KIT_ACTION, { method: 'POST', headers: { Accept: 'application/json' }, body });
    const j = await r.json().catch(() => ({}));
    return r.ok && (!j.status || j.status === 'success');
  } catch (e) {
    // If the browser won't let us read Kit's reply, send it anyway: Kit still records the sign-up.
    try { await fetch(KIT_ACTION, { method: 'POST', mode: 'no-cors', body }); return true; } catch (e2) { return false; }
  }
}
$$('[data-notify]').forEach(form => {
  const input = form.querySelector('input[type=email]'), btn = form.querySelector('button');
  input.addEventListener('input', () => form.classList.remove('err'));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = input.value.trim();
    if (form.company.value) { markDone(okText); return; }
    if (!EMAIL_RE.test(email)) { form.classList.add('err'); showMsg(form, 'bad', 'Please enter a valid email address.'); input.focus(); return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    const ok = await subscribe(email);
    btn.disabled = false; btn.textContent = 'Notify me at launch';
    if (ok) { try { localStorage.setItem(DONE_KEY, '1'); } catch (e2) { /* storage blocked */ } markDone(okText); }
    else showMsg(form, 'bad', 'That didn’t go through. Please try again in a moment.');
  });
});

/* ---------- nav ---------- */
const nav = $('#nav'), dd = $('#dd'), ddBtn = $('.dd-btn'), burger = $('#burger'), sheet = $('#sheet');
const setDD = open => { dd.classList.toggle('open', open); ddBtn.setAttribute('aria-expanded', open); };
ddBtn.addEventListener('click', e => { e.stopPropagation(); setDD(!dd.classList.contains('open')); });
let ddT = 0;
dd.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { clearTimeout(ddT); setDD(true); } });
dd.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') ddT = setTimeout(() => setDD(false), 180); });
$$('a', dd).forEach(a => a.addEventListener('click', () => setDD(false)));
document.addEventListener('click', e => { if (!dd.contains(e.target)) setDD(false); });
const setSheet = open => {
  sheet.classList.toggle('open', open); burger.setAttribute('aria-expanded', open);
  burger.innerHTML = ic(open ? 'x' : 'menu');
  document.documentElement.style.overflow = open ? 'hidden' : '';
  nav.classList.toggle('solid', open || scrollY > 8);
};
burger.addEventListener('click', () => setSheet(!sheet.classList.contains('open')));
$$('a', sheet).forEach(a => a.addEventListener('click', () => setSheet(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') { setDD(false); setSheet(false); } });

/* ---------- reveals, headings, numbers ---------- */
function countUp(el) {
  const to = +el.dataset.count, from = +(el.dataset.from || 0), suf = el.dataset.suffix || '';
  if (reduce) { el.textContent = to + suf; return; }
  const t0 = performance.now(), d = 1400;
  const step = t => {
    const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * e) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target;
  el.classList.add('in'); revealIO.unobserve(el);
  $$('[data-count]', el).forEach(countUp);
  // Once it has arrived, hand the element back to its own hover transitions.
  if (el.hasAttribute('data-reveal')) setTimeout(() => { el.removeAttribute('data-reveal'); el.style.transitionDelay = ''; }, 1500 + (parseFloat(el.style.transitionDelay) || 0));
}), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal]').forEach(el => {
  const sib = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
  const i = sib.indexOf(el);
  if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 50 + 'ms';
  revealIO.observe(el);
});
$$('h2.rise').forEach(el => revealIO.observe(el));

/* ---------- trees ---------- */
const treeSVG = (stage, h) => stage === 0
  ? `<svg class="tr" data-stage="0" viewBox="0 0 64 64" style="width:${h}px;height:${h}px"><ellipse cx="32" cy="58" rx="13" ry="3" fill="#4a3426"/><rect x="27" y="49" width="10" height="9" rx="2" fill="#7a5238"/></svg>`
  : `<svg class="tr" data-stage="${stage}" viewBox="0 0 64 64" style="width:${h}px;height:${h}px"><ellipse cx="32" cy="58" rx="15" ry="3.5" fill="#4a3426"/><rect class="trunk" x="30" y="30" width="4" height="28" rx="2" fill="#9a6a48"/><circle class="leaf l1" cx="32" cy="30" r="8" fill="#2fb350"/><circle class="leaf l2" cx="24" cy="25" r="9" fill="#34c759"/><circle class="leaf l3" cx="40" cy="23" r="10" fill="#3fd46a"/><circle class="leaf l4" cx="32" cy="15" r="11" fill="#4ade80"/></svg>`;
$$('[data-tree]').forEach(el => { const [s, h] = el.dataset.tree.split(':').map(Number); el.innerHTML = treeSVG(s, h); });
const DAYS = ['T', 'F', 'S', 'S', 'M', 'T', 'W'];
$$('[data-garden]').forEach(g => {
  g.innerHTML = g.dataset.garden.split(',').map(Number)
    .map((s, i) => `<div class="d"${i === 6 ? ' style="color:#fff"' : ''}>${treeSVG(s, s ? 28 + s * 5 : 26)}<span>${DAYS[i]}</span></div>`).join('');
});

/* ---------- waveforms ---------- */
const waves = [];
let waveRAF = 0;
function makeWave(el, n) {
  el.innerHTML = '<b></b>'.repeat(n);
  const w = { bars: [...el.children], live: false, phase: Math.random() * 10 };
  waves.push(w); return w;
}
function waveLoop(t) {
  let any = false;
  for (const w of waves) {
    if (!w.live) continue;
    any = true;
    w.bars.forEach((b, i) => { b.style.height = 16 + Math.abs(Math.sin(t / 170 + i * .9 + w.phase) * Math.sin(t / 430 + i * 1.7)) * 84 + '%'; });
  }
  waveRAF = any ? requestAnimationFrame(waveLoop) : 0;
}
function setWave(w, live) {
  w.live = live;
  if (!live) w.bars.forEach(b => (b.style.height = '22%'));
  else if (!waveRAF) waveRAF = requestAnimationFrame(waveLoop);
}

/* ================= AI usage limits (in the notch and in the tile) ================= */
const PROVS = [
  { n: 'Claude', plan: 'Pro', pc: '#e8916f', icon: 'terminal', bg: 'linear-gradient(135deg,#e8916f,#c0583a)', rows: [['c5', '5-hour', 'Resets in 4h 36m'], ['cw', 'Weekly', 'Resets in 2d 5h']] },
  { n: 'Codex', plan: 'Plus', pc: '#5ad1cc', icon: 'code', bg: 'linear-gradient(135deg,#46464f,#18181d)', rows: [['x5', '5-hour', 'Resets in 2h 10m'], ['xw', 'Weekly', 'Resets in 13h 27m']] },
  { n: 'OpenCode Go', plan: 'Go', pc: '#ffb340', icon: 'braces', bg: 'linear-gradient(135deg,#ffcf5c,#e8930c)', rows: [['ow', 'Weekly', 'Resets Monday']] },
];
const LIM = { c5: 86, cw: 57, x5: 94, xw: 82, ow: 64 };
const provHTML = (p, wrap) => `<div${wrap ? ` class="${wrap}"` : ''}><div class="prov"><span class="lg" style="background:${p.bg}">${ic(p.icon)}</span><b>${p.n}</b><span class="pl" style="background:color-mix(in srgb,${p.pc} 20%,transparent);color:${p.pc}">${p.plan}</span><span class="lv"><i></i>Live</span></div>` +
  p.rows.map(([k, l, rs]) => `<div class="lrow"><div class="t">${l}<b><span data-lim="${k}">${LIM[k]}</span>%<small>left</small></b></div><div class="lbar" data-limbar="${k}"><i style="width:${LIM[k]}%"></i></div><div class="rs" data-limrs="${k}" data-rs="${rs}">${rs}</div></div>`).join('') + '</div>';
$$('[data-limits]').forEach(el => { el.innerHTML = PROVS.map(p => provHTML(p, el.classList.contains('pane') ? 'cx' : '')).join(''); });
function limRender() {
  Object.entries(LIM).forEach(([k, v]) => {
    $$(`[data-lim="${k}"]`).forEach(e => (e.textContent = v));
    $$(`[data-limbar="${k}"]`).forEach(e => { e.querySelector('i').style.width = v + '%'; e.classList.toggle('warn', v < 30); });
    $$(`[data-limrs="${k}"]`).forEach(e => { e.innerHTML = esc(e.dataset.rs) + (v < 30 ? ' · <em>runs out ~3:54 AM</em>' : ''); });
  });
}
let limFast = false;
setInterval(() => {
  LIM.c5 -= limFast ? 3 : (Math.random() < .6 ? 1 : 0); if (LIM.c5 < 8) LIM.c5 = 92;
  if (Math.random() < .3) LIM.cw = LIM.cw > 20 ? LIM.cw - 1 : 70;
  if (Math.random() < .4) LIM.x5 = LIM.x5 > 20 ? LIM.x5 - 1 : 96;
  if (Math.random() < .2) LIM.xw = LIM.xw > 20 ? LIM.xw - 1 : 88;
  if (Math.random() < .2) LIM.ow = LIM.ow > 20 ? LIM.ow - 1 : 72;
  limRender();
}, 900);

/* ================= System monitor (in the notch and in the tile) ================= */
const cpuHTML = `<div class="cpu"><div class="hd"><span style="font-size:12px;font-weight:600;color:rgba(255,255,255,.55);display:flex;align-items:center;gap:6px">${ic('cpu', 'width:13px;height:13px')}CPU</span><b><span data-sys="cpu">34</span><small>%</small></b></div>
  <div class="p-s" style="font-size:11px">user <span data-sys="user">24</span>% · system <span data-sys="sysp">10</span>%</div>
  <svg class="spark" viewBox="0 0 200 40" preserveAspectRatio="none"><path data-sys="area" fill="rgba(52,199,89,.15)"/><path data-sys="line" fill="none" stroke="#34c759" stroke-width="2" stroke-linejoin="round"/></svg>
  <div class="cores" data-sys="cores">${'<i><b></b></i>'.repeat(10)}</div>
  <div class="sysrow"><div>GPU<b class="g"><span data-sys="gpu">24</span>%</b></div><div>Network<b class="net">${ic('arrow-down')}<span data-sys="down">3.6 MB/s</span>${ic('arrow-up')}<span data-sys="up">207 KB/s</span></b></div></div></div>`;
const memHTML = `<div class="mem"><div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;color:rgba(255,255,255,.55)"><span style="display:flex;align-items:center;gap:6px">${ic('memory', 'width:13px;height:13px')}Memory</span><span class="tag ok">Normal</span></div>
  <div style="display:flex;justify-content:space-between;margin-top:6px"><b><span data-sys="mem">11.0</span> GB of 16.0 GB</b><span class="p-s" style="font-size:11px">swap 1.2 GB</span></div>
  <div class="segbar"><i data-sys="app" style="width:46%;background:var(--accent)"></i><i style="width:15%;background:#85858b"></i><i style="width:8%;background:#5e5e64"></i></div>
  <div class="lg3"><span style="--c:var(--accent)">App</span><span style="--c:#85858b">Wired</span><span style="--c:#5e5e64">Compressed</span></div>
  <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;font-weight:600;color:rgba(255,255,255,.55)"><span style="display:flex;align-items:center;gap:6px">${ic('hard-drive', 'width:13px;height:13px')}Disk</span><span>233 GB free</span></div>
  <div class="segbar"><i style="width:52%;background:#4c8dff"></i></div>
  <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:650;margin-top:8px">${ic('battery-medium', 'width:16px;height:16px;color:#34c759')}82% <span class="p-s" style="font-size:11px">4h 35m left</span></div></div>`;
const TOP = [['Photos', '#ff9f0a', 27], ['Safari', '#4c8dff', 15], ['Messages', '#34c759', 6], ['Mail', '#61b6ff', 3], ['Music', '#ff2d55', 2]];
const topHTML = `<div class="topapps"><div class="lab">Top apps <span class="fil" style="margin:0"><b class="on">CPU</b><b>Memory</b></span></div>` +
  TOP.map(([n, c, v], i) => `<div style="--w:${v * 3}%"><i style="background:${c}"></i>${n}<em data-top="${i}">${v}%</em></div>`).join('') + '</div>';
$$('[data-system]').forEach(el => (el.innerHTML = `<div class="cx" style="flex:1.25">${cpuHTML}</div><div class="cx">${memHTML}</div><div class="cx">${topHTML}</div>`));
$$('[data-system-tile]').forEach(el => (el.innerHTML = `<div>${cpuHTML}</div><div>${memHTML}</div>`));
const cpuHist = Array.from({ length: 40 }, () => 25 + Math.random() * 15);
let sysLoad = false, cpuNow = 34, gpuNow = 24, memNow = 11.0;
const pathOf = (a, h) => a.map((v, i) => `${i ? 'L' : 'M'}${(i / (a.length - 1) * 200).toFixed(1)} ${(h - v / 100 * (h - 4) - 2).toFixed(1)}`).join(' ');
function sysTick() {
  const target = sysLoad ? 78 : 32;
  cpuNow = clamp(cpuNow + (target - cpuNow) * .25 + (Math.random() - .5) * 14, 4, 97);
  gpuNow = clamp(gpuNow + (Math.random() - .5) * 8 + (sysLoad ? 2 : -1), 6, 90);
  memNow = clamp(memNow + (Math.random() - .5) * .2 + (sysLoad ? .05 : -.02), 10.4, 13.2);
  cpuHist.push(cpuNow); cpuHist.shift();
  const d = pathOf(cpuHist, 40);
  const set = (k, v) => $$(`[data-sys="${k}"]`).forEach(e => (e.textContent = v));
  set('cpu', Math.round(cpuNow)); set('user', Math.round(cpuNow * .7)); set('sysp', Math.round(cpuNow * .3));
  set('gpu', Math.round(gpuNow)); set('mem', memNow.toFixed(1));
  set('down', (1 + Math.random() * 5).toFixed(1) + ' MB/s'); set('up', Math.round(80 + Math.random() * 300) + ' KB/s');
  $$('[data-sys="line"]').forEach(e => e.setAttribute('d', d));
  $$('[data-sys="area"]').forEach(e => e.setAttribute('d', d + ' L200 40 L0 40 Z'));
  $$('[data-sys="app"]').forEach(e => (e.style.width = (memNow / 16 * 100 - 23).toFixed(1) + '%'));
  $$('[data-sys="cores"]').forEach(c => [...c.children].forEach(i => (i.firstChild.style.height = clamp(cpuNow + (Math.random() - .5) * 60, 4, 100) + '%')));
  TOP.forEach((t, i) => { const v = clamp(t[2] + Math.round((Math.random() - .5) * 4) + (sysLoad && i === 0 ? 30 : 0), 1, 90); $$(`[data-top="${i}"]`).forEach(e => { e.textContent = v + '%'; e.parentElement.style.setProperty('--w', v * 2.4 + '%'); }); });
}
sysTick(); setInterval(sysTick, 800);

/* ================= HERO: a Mac with Lintel in its notch ================= */
const device = $('#device');
// On phones, show the top middle of the screen, where the notch is, so the island stays readable.
function fit() {
  const crop = innerWidth <= 720 ? 820 : 1232, s = device.clientWidth / crop;
  device.style.setProperty('--s', s);
  device.style.setProperty('--ox', -(1232 - crop) / 2 * s + 'px');
  device.style.setProperty('--oy', (crop < 1232 ? -16 * s : 0) + 'px');
}
fit();
addEventListener('resize', fit);
const now = new Date();
$('#dClock').textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '') + ' ' +
  now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, '');
const longDate = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

const isl = $('#isl');
const layers = { tabs: $('#Ltabs'), voice: $('#Lvoice'), copied: $('#Lcopied'), prompt: $('#Lprompt') };
const SIZES = { closed: [200, 32, 13], tabs: [760, 276, 28], voice: [560, 52, 22], copied: [380, 46, 20], prompt: [820, 206, 28] };
let islMode = 'closed', curTab = 'home';
function islSet(mode) {
  const [w, h, r] = SIZES[mode];
  isl.style.setProperty('--iw', w + 'px'); isl.style.setProperty('--ih', h + 'px'); isl.style.setProperty('--ir', r + 'px');
  Object.entries(layers).forEach(([k, el]) => el.classList.toggle('on', k === mode));
  isl.classList.toggle('open', mode !== 'closed');
  islMode = mode;
}
const TABS = {
  home: ['Home', longDate, 'Rest the pointer on the notch: your music, your next meeting and your tools, one glance up.'],
  meetings: ['Meetings', '', 'Both sides of the call, written down as you talk, in English, Hindi or Bengali.'],
  todos: ['Todos', '5 today', 'Your todos, synced with Reminders, a glance away.'],
  grove: ['Grove', '7-day streak', 'A tree grows while you focus, and distracting apps and sites stay blocked.'],
  usage: ['Limits', '', 'See how much is left on Claude, Codex and OpenCode Go, live, with a heads-up before you run out.'],
  clipboard: ['Clipboard', '6 items', 'Everything you copied, a click away. Copies marked as passwords are never kept.'],
  system: ['System', '', 'CPU, GPU, memory, disk, network and battery, and which apps use the most, one glance up.'],
  shelf: ['Shelf', '4 items', 'Drop files on the notch, then drag them out, copy them or AirDrop them.'],
};
function tabSet(t) {
  curTab = t;
  $$('#Ltabs .tb button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  $$('#Ltabs .pane').forEach(p => p.classList.toggle('on', p.dataset.pane === t));
  $('#iTitle').textContent = TABS[t][0];
  $('#iSub').textContent = TABS[t][1];
}
const WINS = ['wMail', 'wCall', 'wBrowser', 'wTerm', 'wFinder'];
const wins = (...ids) => WINS.forEach(id => $('#' + id).classList.toggle('on', ids.includes(id)));
const dCur = $('#dCur');
const cur = (x, y) => { dCur.style.left = x + 'px'; dCur.style.top = y + 'px'; };
const click = async () => { dCur.classList.add('click'); await sleep(160); dCur.classList.remove('click'); };
const iWave = makeWave($('#iWave'), 16);

let cleanups = [];
const every = (fn, ms) => { const id = setInterval(fn, ms); cleanups.push(() => clearInterval(id)); };
const clean = () => { cleanups.forEach(f => f()); cleanups = []; setWave(iWave, false); limFast = false; sysLoad = false; };
function resetDesk() {
  $('#dSay').classList.remove('on'); $('#dKeys').classList.remove('on');
  $('#wCall').classList.remove('presenting');
  $$('#wCall .ct').forEach(t => t.classList.remove('talk'));
  $('#pAirdrop').classList.remove('hot');
  const fly = $('#dFly'); fly.style.opacity = 0;
}

async function sHome(ok) {
  wins(); resetDesk();
  if (islMode !== 'closed' && islMode !== 'tabs') islSet('closed');
  tabSet('home');
  cur(860, 560);
  await sleep(500); if (!ok()) return;
  cur(640, 16);
  await sleep(950); if (!ok()) return;
  islSet('tabs');
  let w = 38; every(() => { w = w >= 100 ? 0 : w + .7; $('#pMusic').style.width = w + '%'; }, 250);
  let m = 14 * 60; every(() => { m--; $('#pNext').textContent = `In ${Math.ceil(m / 60)} min`; }, 1000);
  await sleep(1300); if (!ok()) return;
  cur(470, 210);
}
async function sVoice(ok) {
  resetDesk(); islSet('closed'); wins('wMail');
  const body = $('#dMailBody');
  body.innerHTML = '<span class="ph">Write your message…</span>';
  cur(560, 470);
  await sleep(700); if (!ok()) return;
  const words = 'Hi Maya, can we push the design review to Thursday? I’d like the team to see the new onboarding flow first.'.split(' ');
  islSet('voice'); setWave(iWave, true);
  const sayT = $('#dSayT'); sayT.innerHTML = ''; $('#dSay').classList.add('on');
  const t0 = performance.now();
  every(() => ($('#iVT').textContent = fmt((performance.now() - t0) / 1000)), 250);
  for (let i = 1; i <= words.length; i++) {
    await sleep(170 + Math.random() * 90); if (!ok()) return;
    const fin = Math.max(0, i - 2);
    sayT.innerHTML = '“' + esc(words.slice(0, fin).join(' ')) + ' <span class="v">' + esc(words.slice(fin, i).join(' ')) + '</span>”';
  }
  sayT.textContent = '“' + words.join(' ') + '”';
  await sleep(500); if (!ok()) return;
  setWave(iWave, false); islSet('copied');
  await sleep(700); if (!ok()) return;
  $('#dSay').classList.remove('on');
  await click(); if (!ok()) return;
  const keys = $('#dKeys'); keys.innerHTML = '<b>⌘</b><b>V</b>'; keys.classList.add('on');
  await sleep(500); if (!ok()) { keys.classList.remove('on'); return; }
  body.textContent = words.join(' ');
  body.classList.remove('flash'); void body.offsetWidth; body.classList.add('flash');
  await sleep(500); keys.classList.remove('on');
  await sleep(900); if (!ok()) return;
  islSet('closed');
}
async function sMeetings(ok) {
  resetDesk(); wins('wCall'); tabSet('meetings');
  const lns = $$('#Ltabs [data-pane=meetings] .ln');
  lns.forEach(l => l.classList.remove('in'));
  cur(980, 600);
  islSet('tabs');
  let secs = 42; every(() => ($('#pMeetClock').textContent = fmt(++secs)), 1000);
  const talk = who => { $('#dThem').classList.toggle('talk', who === 'them'); $('#dMe').classList.toggle('talk', who === 'me'); };
  for (const [who, i, wait] of [['them', 0, 700], ['me', 1, 1500], ['them', 2, 1600]]) {
    talk(who); await sleep(wait); if (!ok()) return;
    lns[i].classList.add('in');
  }
  talk(null);
}
function sPrompter(ok) {
  resetDesk(); wins('wCall'); $('#wCall').classList.add('presenting'); $('#dMe').classList.add('talk');
  islSet('prompt'); cur(980, 640);
  const txt = $('#iPTxt'), lines = [...txt.children], LH = 40.5;
  let off = -30, last = performance.now(), secs = 35;
  every(() => ($('#iPT').textContent = fmt(secs--)), 1000);
  const frame = t => {
    if (!ok()) return;
    off += (t - last) / 1000 * 26; last = t;
    if (off > lines.length * LH - 70) off = -30;
    txt.style.transform = `translateY(${-off}px)`;
    const c = Math.round((off + 52) / LH);
    lines.forEach((l, i) => l.classList.toggle('cur', i === c));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function sGrove(ok) {
  resetDesk(); wins('wBrowser'); tabSet('grove'); islSet('tabs'); cur(700, 600);
  let left = 31 * 60 + 50, p = .64;
  const step = () => {
    $('#pGrove').textContent = fmt(left); $('#dLeft').textContent = fmt(left) + ' left';
    $('#pRing').style.strokeDashoffset = 282.7 * (1 - p); $('#dLeftBar').style.width = p * 100 + '%';
    left--; p = Math.min(1, p + .004);
  };
  step(); every(step, 1000);
}
async function sUsage(ok) {
  resetDesk(); wins('wTerm'); tabSet('usage'); islSet('tabs'); cur(1000, 640);
  limFast = true;
  const term = $('#dTerm');
  term.innerHTML = '';
  const lines = [
    ['p', '~/lintel $ claude'], ['dim', 'Welcome back. 5-hour window: 86% left'], ['p', '› Add a shortcut editor to Settings'],
    ['dim', '  Reading SettingsView.swift, Shortcuts.swift…'], ['ok', '  ✓ Updated 3 files'], ['dim', '  Running the tests…'], ['ok', '  ✓ 48 tests passed'],
    ['p', '› Now polish the onboarding copy'], ['dim', '  Thinking…'],
  ];
  for (const [c, t] of lines) {
    await sleep(520); if (!ok()) return;
    term.insertAdjacentHTML('beforeend', `<div class="${c}">${esc(t)}</div>`);
    requestAnimationFrame(() => term.lastElementChild.classList.add('in'));
  }
}
async function sShelf(ok) {
  resetDesk(); islSet('closed'); wins('wFinder'); tabSet('shelf');
  const box = $('#pShelf');
  box.querySelectorAll('.f.new').forEach(f => f.remove());
  const file = $('#dFile'), fly = $('#dFly');
  const fx = 310 + 130 + 18 + 2 * (82 + 16) + 10, fy = 330 + 36 + 18;
  cur(fx + 30, fy + 30);
  await sleep(1000); if (!ok()) return;
  await click(); if (!ok()) return;
  fly.style.transition = 'none'; fly.style.left = fx + 'px'; fly.style.top = fy + 'px'; fly.style.transform = 'none';
  void fly.offsetWidth; fly.style.transition = ''; fly.style.opacity = 1;
  file.style.opacity = .35;
  await sleep(80);
  fly.style.left = '569px'; fly.style.top = '6px'; fly.style.transform = 'scale(.55)';
  cur(600, 30);
  await sleep(800); if (!ok()) return;
  islSet('tabs'); fly.style.opacity = 0; file.style.opacity = 1;
  await sleep(450); if (!ok()) return;
  box.insertAdjacentHTML('beforeend', '<div class="f new"><span class="thumb" style="background:linear-gradient(135deg,#7aa7ff,#2d5be3)"></span>Launc…ter.png</div>');
  await sleep(900); if (!ok()) return;
  cur(895, 150);
  await sleep(950); if (!ok()) return;
  await click(); if (ok()) $('#pAirdrop').classList.add('hot');
}
function sSystem(ok) {
  resetDesk(); wins('wTerm'); tabSet('system'); islSet('tabs'); cur(1000, 640);
  const term = $('#dTerm');
  term.innerHTML = '<div class="p in">~/lintel $ swift build -c release</div>';
  sysLoad = true;
  let n = 0;
  every(() => {
    n++;
    if (n < 9) { term.insertAdjacentHTML('beforeend', `<div class="dim in">[${n * 34}/312] Compiling Lintel ${['IslandView', 'Meetings', 'WhisperEngine', 'Grove', 'Shelf', 'SystemMonitor', 'Limits', 'Prompter'][n - 1]}.swift</div>`); }
    else if (n === 9) { term.insertAdjacentHTML('beforeend', '<div class="ok in">Build complete! (41.2s)</div>'); sysLoad = false; }
  }, 650);
}
const TOUR = [
  { t: 'home', title: 'Home', d: 6000, run: sHome },
  { t: 'voice', title: 'Voice typing', text: 'Hold ⌥ and speak. Let go, and your words are ready to paste into any app.', d: 9000, run: sVoice },
  { t: 'meetings', title: 'Meeting notes', d: 6500, run: sMeetings },
  { t: 'prompt', title: 'Teleprompter', text: 'Your script scrolls right under the camera, so you keep eye contact. Nobody on the call sees it.', d: 6500, run: sPrompter },
  { t: 'grove', title: 'Focus', d: 5500, run: sGrove },
  { t: 'usage', title: 'AI usage limits', d: 7000, run: sUsage },
  { t: 'shelf', title: 'File shelf', d: 7500, run: sShelf },
  { t: 'system', title: 'System monitor', d: 7000, run: sSystem },
];
const stepsEl = $('#steps');
stepsEl.innerHTML = TOUR.map(s => `<button aria-label="${s.title}"><i></i></button>`).join('');
const stepBtns = $$('button', stepsEl);
let ti = 0, tRun = 0, tTimer = 0, playing = !reduce, demoVisible = false;
const tourTx = $('#tourTx'), pp = $('#tourPP');
const setText = (title, text) => (tourTx.innerHTML = `<b>${esc(title)}</b>${esc(text)}`);
function go(i) {
  ti = (i + TOUR.length) % TOUR.length;
  const st = TOUR[ti], run = ++tRun, ok = () => run === tRun;
  clean();
  stepBtns.forEach((b, j) => {
    b.classList.toggle('done', j < ti); b.classList.toggle('cur', j === ti);
    const f = b.querySelector('i'); f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
    b.style.setProperty('--d', st.d + 'ms');
  });
  setText(st.title, st.text || TABS[st.t][2]);
  st.run(ok);
  clearTimeout(tTimer);
  if (playing && demoVisible) tTimer = setTimeout(() => go(ti + 1), st.d);
}
function setPlaying(p) {
  playing = p;
  stepsEl.classList.toggle('paused', !p);
  pp.innerHTML = ic(p ? 'pause' : 'play');
  pp.setAttribute('aria-label', p ? 'Pause the demo' : 'Play the demo');
  clearTimeout(tTimer);
  if (p && demoVisible) tTimer = setTimeout(() => go(ti + 1), 2500);
}
pp.addEventListener('click', () => { if (playing) setPlaying(false); else { setPlaying(true); go(ti + 1); } });
stepBtns.forEach((b, j) => b.addEventListener('click', () => go(j)));
function openTab(t) {
  if (playing) setPlaying(false);
  tRun++; clean(); resetDesk();
  tabSet(t); islSet('tabs');
  wins(...({ meetings: ['wCall'], grove: ['wBrowser'], usage: ['wTerm'], shelf: ['wFinder'] }[t] || []));
  stepBtns.forEach(x => x.classList.remove('cur', 'done'));
  setText(TABS[t][0], TABS[t][2]);
}
// Clicking a tab in the notch takes over the demo, like the real thing.
$$('#Ltabs .tb button').forEach(b => b.addEventListener('click', () => openTab(b.dataset.tab)));
isl.addEventListener('pointerenter', () => { if (islMode === 'closed' && !playing) { islSet('tabs'); tabSet(curTab); } });
$('#watch').addEventListener('click', () => { setPlaying(true); setTimeout(() => go(0), 500); });
onView(device, () => { if (!demoVisible) { demoVisible = true; go(ti); } }, () => { demoVisible = false; clearTimeout(tTimer); }, .25);
tabSet('home');

/* scrolling: the nav turns solid once the page moves */
let scrollQueued = false;
function onScroll() {
  scrollQueued = false;
  nav.classList.toggle('solid', scrollY > 8 || sheet.classList.contains('open'));
}
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

/* ================= VOICE TYPING ================= */
const samples = [
  { to: 'Maya Chen', sub: 'Design review', text: 'Hi Maya, can we push the design review to Thursday? I’d like the team to see the new onboarding flow first.' },
  { to: 'Rohan', sub: 'Aaj ki call', text: 'Yaar, main thoda late ho jaoonga. Sabko bata dena ki call paanch baje start hogi.' },
  { to: 'Ankita', sub: 'Today', text: 'আজকে আমি অফিসে একটু দেরি করে পৌঁছাব, তুমি প্লিজ ক্লায়েন্টকে একটা মেইল করে দিও।' },
  { to: 'Release team', sub: 'Before we ship', text: 'আমার মনে হয় ফিচারটা খুব কাজের হবে, but we need to test it properly before the release.' },
];
const key = $('#key'), heard = $('#heard'), mBody = $('#mBody'), vMini = $('#vMini'), paste = $('#paste');
const vWave = makeWave($('#vWave'), 12);
let vWords = [], nHeard = 0, holding = false, vTimer = 0, vClock = 0, voiceSeen = false, voiceVisible = false, autoRun = 0;
function vMiniState(s) {
  $('#vRec').classList.toggle('on', s === 'rec'); $('#vCopied').classList.toggle('on', s === 'copied');
  const [w, h] = s === 'rec' ? [300, 36] : s === 'copied' ? [280, 36] : [130, 24];
  vMini.style.width = w + 'px'; vMini.style.height = h + 'px';
}
function pickSample(i) {
  $$('#samples button').forEach((b, j) => b.classList.toggle('cur', j === i));
  $('#mTo').textContent = samples[i].to; $('#mSub').textContent = samples[i].sub;
  mBody.innerHTML = '<span class="ph">Your words land here when you paste.</span>';
  heard.innerHTML = ''; nHeard = 0; vWords = samples[i].text.split(' ');
}
function renderHeard() {
  const fin = Math.max(0, nHeard - 2);
  heard.innerHTML = esc(vWords.slice(0, fin).join(' ')) + (nHeard > fin ? ' <span class="v">' + esc(vWords.slice(fin, nHeard).join(' ')) + '</span>' : '');
}
let talkRun = 0;
// Stops whatever the demo is doing, typing or pasting, so a new choice takes over at once.
function abortTalk() {
  talkRun++; holding = false;
  clearTimeout(vTimer); clearInterval(vClock); setWave(vWave, false);
  key.classList.remove('down'); paste.classList.remove('on'); vMiniState('idle');
}
function startTalk() {
  if (holding) abortTalk();
  const run = ++talkRun;
  holding = true; nHeard = 0; heard.innerHTML = '';
  key.classList.add('down');
  const t0 = performance.now();
  $('#vT').textContent = '0:00';
  vMiniState('rec'); setWave(vWave, true);
  clearInterval(vClock);
  vClock = setInterval(() => ($('#vT').textContent = fmt((performance.now() - t0) / 1000)), 250);
  const step = () => {
    if (!holding || run !== talkRun) return;
    if (nHeard < vWords.length) { nHeard++; renderHeard(); }
    vTimer = setTimeout(step, 240 + Math.random() * 150);
  };
  vTimer = setTimeout(step, 340);
}
async function stopTalk() {
  if (!holding) return;
  holding = false;
  const run = talkRun, ok = () => run === talkRun;
  key.classList.remove('down'); clearTimeout(vTimer); clearInterval(vClock); setWave(vWave, false);
  if (nHeard === 0) { vMiniState('idle'); heard.textContent = 'Hold a little longer, and talk.'; return; }
  const said = vWords.slice(0, nHeard).join(' ');
  heard.textContent = said;
  vMiniState('copied');
  await sleep(650); if (!ok()) return; paste.classList.add('on');
  await sleep(550); if (!ok()) return;
  mBody.textContent = said;
  mBody.classList.remove('flash'); void mBody.offsetWidth; mBody.classList.add('flash');
  await sleep(450); if (!ok()) return; paste.classList.remove('on');
  await sleep(900);
  if (ok() && !holding) vMiniState('idle');
}
async function autoTalk() {
  const run = ++autoRun;
  await sleep(500);
  if (run !== autoRun || holding || !voiceVisible) return;
  startTalk();
  while (holding && nHeard < vWords.length && run === autoRun) await sleep(120);
  await sleep(450);
  if (run === autoRun && holding) stopTalk();
}
key.addEventListener('pointerdown', e => { e.preventDefault(); autoRun++; key.setPointerCapture(e.pointerId); startTalk(); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => key.addEventListener(n, () => { if (holding) stopTalk(); }));
key.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); autoRun++; startTalk(); } });
key.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stopTalk(); });
addEventListener('keydown', e => { if (e.key === 'Alt' && voiceVisible && !e.repeat) { e.preventDefault(); autoRun++; startTalk(); } });
addEventListener('keyup', e => { if (e.key === 'Alt' && holding) stopTalk(); });
// Picking another language takes over straight away, even mid-sentence.
$$('#samples button').forEach((b, i) => b.addEventListener('click', () => { autoRun++; abortTalk(); pickSample(i); autoTalk(); }));
pickSample(0);
onView($('.vgrid'), () => { voiceVisible = true; if (!voiceSeen) { voiceSeen = true; autoTalk(); } },
  () => { voiceVisible = false; autoRun++; if (holding) stopTalk(); }, .45);

const raw = $('#raw'), cleanSw = $('#cleanSw');
let cleanTouched = false, cleanLoop = 0;
const setClean = on => { cleanSw.setAttribute('aria-checked', on); raw.classList.toggle('clean', on); };
cleanSw.addEventListener('click', () => { cleanTouched = true; clearInterval(cleanLoop); setClean(cleanSw.getAttribute('aria-checked') !== 'true'); });
onView(raw, () => {
  if (cleanTouched || cleanLoop) return;
  setTimeout(() => !cleanTouched && setClean(true), 900);
  cleanLoop = setInterval(() => !cleanTouched && setClean(!raw.classList.contains('clean')), 3600);
}, () => { if (!cleanTouched) { clearInterval(cleanLoop); cleanLoop = 0; } }, .6);

const sentences = [
  [['hi', 'Kal ki meeting cancel karo,'], ['en', 'we’ll do it on Monday.']],
  [['bn', 'আমার মনে হয় ফিচারটা খুব কাজের হবে,'], ['en', 'but let’s test it first.']],
  [['en', 'Send me the deck tonight,'], ['hi', 'main subah review kar lunga.']],
];
const tagText = { hi: 'Hindi', bn: 'Bengali', en: 'English' };
const sent = $('#sent'), sdots = $('#sdots');
sdots.innerHTML = sentences.map((_, i) => `<button aria-label="Example ${i + 1}"></button>`).join('');
let sentI = 0, riverRun = 0;
$$('button', sdots).forEach((b, i) => b.addEventListener('click', () => { sentI = i; river(++riverRun); }));
async function river(run) {
  while (run === riverRun) {
    $$('button', sdots).forEach((b, i) => b.classList.toggle('cur', i === sentI));
    sent.innerHTML = sentences[sentI].map(([l, t]) => `<span class="run ${l}" lang="${l}"><span class="tag ${l}">${tagText[l]}</span>` +
      t.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join('') + '<i class="under"></i></span>').join('');
    sent.style.opacity = 1;
    for (const r of $$('.run', sent)) {
      for (const w of $$('.w', r)) { await sleep(reduce ? 0 : 110); if (run !== riverRun) return; w.classList.add('lit'); }
      r.classList.add('done'); await sleep(260);
    }
    await sleep(2600); if (run !== riverRun) return;
    sent.style.opacity = 0; await sleep(450);
    sentI = (sentI + 1) % sentences.length;
  }
}
onView($('.river'), () => river(++riverRun), () => riverRun++, .4);

/* ================= MEETINGS ================= */
const cMini = $('#cMini'), callScr = $('#callScr'), cCur = $('#cCur'), linesEl = $('#lines'), panel = $('#panel');
const mLines = [
  { who: 'them', text: 'So the beta goes out on Friday, right?' },
  { who: 'me', text: 'Haan, bas final testing baaki hai.' },
  { who: 'them', live: 'Aami report ta Friday er modhye pathiye debo.', text: 'আমি রিপোর্টটা ফ্রাইডের মধ্যে পাঠিয়ে দেব।' },
  { who: 'me', text: 'Perfect. Let’s lock the date today.' },
];
let meetRun = 0, meetClock = 0;
function cMiniState(s) {
  cMini.querySelector('.offer').classList.toggle('on', s === 'offer');
  cMini.querySelector('.rec').classList.toggle('on', s === 'rec');
  const [w, h] = s === 'offer' ? [Math.min(260, callScr.clientWidth - 24), 80] : s === 'rec' ? [180, 28] : [120, 22];
  cMini.style.width = w + 'px'; cMini.style.height = h + 'px';
}
const moveC = (x, y) => { cCur.style.left = x + 'px'; cCur.style.top = y + 'px'; };
async function typeInto(el, text, ms, ok) {
  el.textContent = '';
  for (const g of graphemes(text)) { if (!ok()) return; el.textContent += g; await sleep(ms); }
}
async function meeting(run) {
  const ok = () => run === meetRun;
  clearInterval(meetClock);
  $$('#callScr .ct').forEach(t => t.classList.remove('talk'));
  panel.classList.remove('sum'); linesEl.innerHTML = '';
  $('#pClock').textContent = '0:00'; $('#cMiniClock').textContent = '0:00';
  $('#askQ').textContent = ''; $('#askA').textContent = '';
  $$('#summary li, #summary .todo').forEach(e => e.classList.remove('in'));
  $('#pHead').innerHTML = '<span style="color:var(--ink3)">Waiting for a call…</span>';
  cMiniState('idle');
  moveC(callScr.clientWidth * .72, callScr.clientHeight * .8);
  await sleep(900); if (!ok()) return;
  cMiniState('offer');
  await sleep(750); if (!ok()) return;
  const r = $('#offerYes').getBoundingClientRect(), sr = callScr.getBoundingClientRect();
  moveC(r.left - sr.left + r.width * .45, r.top - sr.top + r.height * .45);
  await sleep(1050); if (!ok()) return;
  cCur.classList.add('click'); await sleep(170); cCur.classList.remove('click');
  cMiniState('rec');
  moveC(callScr.clientWidth * .86, callScr.clientHeight * 1.08);
  $('#pHead').innerHTML = '<span class="dot"></span>Transcribing · Zoom';
  const t0 = performance.now();
  meetClock = setInterval(() => { const t = fmt((performance.now() - t0) / 1000); $('#pClock').textContent = t; $('#cMiniClock').textContent = t; }, 500);
  for (const L of mLines) {
    if (!ok()) return;
    const tile = L.who === 'them' ? $('#tThem') : $('#tMe');
    tile.classList.add('talk');
    const el = document.createElement('div');
    el.className = 'line';
    el.innerHTML = `<div class="who ${L.who}">${L.who === 'them' ? 'Them' : 'Me'}</div><div class="txt"></div>`;
    linesEl.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    const txt = el.querySelector('.txt'), words = (L.live || L.text).split(' ');
    for (let i = 1; i <= words.length; i++) {
      await sleep(140 + Math.random() * 90); if (!ok()) return;
      const fin = Math.max(0, i - 2);
      txt.innerHTML = esc(words.slice(0, fin).join(' ')) + ' <span class="v">' + esc(words.slice(fin, i).join(' ')) + '</span>';
    }
    txt.textContent = words.join(' ');
    tile.classList.remove('talk');
    if (L.live) {
      await sleep(900); if (!ok()) return;
      txt.innerHTML = `<span class="swap"><span class="a">${esc(L.live)}</span><span class="b" lang="bn">${esc(L.text)}</span></span><span class="ref">${ic('check')}Bengali model</span>`;
      await sleep(60); el.classList.add('refined');
    }
    while (linesEl.scrollHeight > linesEl.clientHeight + 2 && linesEl.children.length > 1) linesEl.firstElementChild.remove();
    await sleep(520);
  }
  await sleep(1000); if (!ok()) return;
  clearInterval(meetClock); cMiniState('idle');
  $('#pHead').innerHTML = `<span style="color:var(--green);display:flex;align-items:center;gap:8px">${ic('circle-check')}Saved · Summary</span>`;
  panel.classList.add('sum');
  for (const e of $$('#summary li, #summary .todo')) { await sleep(420); if (!ok()) return; e.classList.add('in'); }
  await sleep(500);
  await typeInto($('#askQ'), 'When does the beta go out?', 30, ok);
  await sleep(500);
  await typeInto($('#askA'), 'Friday, once final testing is done. Ankita sends the report the same day.', 16, ok);
  await sleep(5200);
  if (ok()) meeting(++meetRun);
}
let meetVisible = false;
onView(callScr, () => { if (!meetVisible) { meetVisible = true; meeting(++meetRun); } },
  () => { meetVisible = false; meetRun++; clearInterval(meetClock); $$('#callScr .ct').forEach(t => t.classList.remove('talk')); }, .35);
$('#replay').addEventListener('click', () => meeting(++meetRun));

/* ================= EVERYTHING: live tiles ================= */
// Shelf: files dropped here stay on this page; nothing is uploaded.
const shelf = $('#shelf');
const shelfDefault = shelf.innerHTML;
const midName = n => (n.length > 14 ? n.slice(0, 5) + '…' + n.slice(-8) : n);
const thumbFor = name => /\.pdf$/i.test(name) ? '<span class="thumb doc" style="background:linear-gradient(#ff7a7a,#e5484d)"></span>'
  : `<span class="thumb" style="background:linear-gradient(135deg,hsl(${(name.length * 47) % 360} 80% 65%),hsl(${(name.length * 47 + 60) % 360} 70% 45%))"></span>`;
['dragenter', 'dragover'].forEach(n => shelf.addEventListener(n, e => { e.preventDefault(); shelf.classList.add('over'); }));
['dragleave', 'drop'].forEach(n => shelf.addEventListener(n, () => shelf.classList.remove('over')));
shelf.addEventListener('drop', e => {
  e.preventDefault();
  [...(e.dataTransfer.files || [])].slice(0, 4).forEach(f => shelf.insertAdjacentHTML('beforeend', `<div class="f new" title="${esc(f.name)}">${thumbFor(f.name)}${esc(midName(f.name))}</div>`));
  while (shelf.children.length > 5) shelf.firstElementChild.remove();
});
const flash = (btn, msg) => { btn.classList.add('hot'); setTimeout(() => btn.classList.remove('hot'), 1200); say(msg); };
$('#sAir').addEventListener('click', e => flash(e.currentTarget, 'In Lintel, this opens AirDrop with the files on your shelf.'));
$('#sCopy').addEventListener('click', e => flash(e.currentTarget, `Copied ${shelf.children.length} files. Paste them into any app.`));
$('#sClear').addEventListener('click', () => {
  [...shelf.children].forEach((f, i) => { f.style.transition = 'opacity .3s, transform .3s'; f.style.transitionDelay = i * 50 + 'ms'; f.style.opacity = 0; f.style.transform = 'scale(.8)'; });
  setTimeout(() => { shelf.innerHTML = '<span style="color:var(--ink3);font-size:13.5px">Shelf cleared. Drop a file here.</span>'; }, 450);
  setTimeout(() => { if (!shelf.querySelector('.f')) shelf.innerHTML = shelfDefault; }, 4500);
});

// Teleprompter tile
const mprom = $('#mprom'), mpTx = $('#mpTx');
let mpOff = -20, mpLast = 0, mpOn = false, mpHover = false;
mprom.addEventListener('pointerenter', () => (mpHover = true));
mprom.addEventListener('pointerleave', () => (mpHover = false));
function mpFrame(t) {
  if (!mpOn) return;
  const dt = Math.min(.05, (t - (mpLast || t)) / 1000); mpLast = t;
  if (!mpHover && !reduce) { mpOff += dt * 16; if (mpOff > mpTx.offsetHeight - 20) mpOff = -40; }
  mpTx.style.transform = `translateY(${-mpOff}px)`;
  requestAnimationFrame(mpFrame);
}
onView(mprom, () => { if (!mpOn) { mpOn = true; mpLast = 0; requestAnimationFrame(mpFrame); } }, () => (mpOn = false), .3);

// Focus tile
const fArc = $('#fArc'), fTime = $('#fTime'), fStart = $('#fStart'), fState = $('#fState');
const fTree = () => $('#fTree svg');
let fRun = false, fLeft = 1500, fInt = 0;
function fRender() {
  fTime.textContent = fmt(fLeft);
  const frac = fLeft / 1500;
  fArc.style.strokeDashoffset = fRun ? 282.7 * frac : 282.7;
  if (fRun) fTree().dataset.stage = Math.min(4, 1 + Math.floor((1 - frac) * 3.4));
}
function fStop(done) {
  fRun = false; clearInterval(fInt);
  fStart.innerHTML = ic('play') + 'Start';
  if (done) { fState.textContent = 'New tree'; fTree().dataset.stage = 4; fArc.style.strokeDashoffset = 0; }
  setTimeout(() => { if (!fRun) { fState.textContent = 'Ready'; fTree().dataset.stage = 0; fLeft = 1500; fRender(); } }, done ? 3500 : 0);
}
fStart.addEventListener('click', () => {
  if (fRun) return fStop(false);
  fRun = true; fLeft = 1500; fState.textContent = 'Blocking 6 sites';
  fStart.innerHTML = ic('x') + 'Give up';
  fRender();
  fInt = setInterval(() => { fLeft -= 30; if (fLeft <= 0) { fLeft = 0; fRender(); fStop(true); } else fRender(); }, 250);
});
fRender();

// Music
const tracks = [
  { t: 'Golden Hour', a: 'Lumen Drift', c1: '#ff7a59', c2: '#a63fd1', len: 213 },
  { t: 'Night Swim', a: 'Halcyon Park', c1: '#3fb5ff', c2: '#5b3df5', len: 184 },
  { t: 'Paper Planes', a: 'The Quiet Hours', c1: '#ffd166', c2: '#ef476f', len: 221 },
];
const music = $('#t-music');
let trk = 0, pos = 87, playingM = true;
function mRender() {
  const T = tracks[trk];
  $('#mProg').style.width = pos / T.len * 100 + '%';
  $('#mCur').textContent = fmt(pos); $('#mLeft').textContent = '-' + fmt(T.len - pos);
}
function setTrack(i, keep) {
  trk = (i + tracks.length) % tracks.length;
  const T = tracks[trk];
  music.style.setProperty('--c1', T.c1); music.style.setProperty('--c2', T.c2);
  $('#mTitle').textContent = T.t; $('#mArtist').textContent = T.a;
  if (!keep) pos = 0;
  mRender();
}
function setPlayingM(p) { playingM = p; music.classList.toggle('playing', p); $('#mPP').innerHTML = ic(p ? 'pause' : 'play'); }
$('#mPP').addEventListener('click', () => setPlayingM(!playingM));
$('#mNext').addEventListener('click', () => setTrack(trk + 1));
$('#mPrev').addEventListener('click', () => (pos > 3 ? (pos = 0, mRender()) : setTrack(trk - 1)));
setInterval(() => { if (!playingM) return; pos += .5; if (pos >= tracks[trk].len) setTrack(trk + 1); else mRender(); }, 500);
setTrack(0, true); setPlayingM(true);

// Next up
const nStart = Date.now();
setInterval(() => {
  const left = Math.max(0, 14 * 60 - (Date.now() - nStart) / 1000);
  $('#nIn').textContent = left > 0 ? `In ${Math.floor(left / 60)}m ${String(Math.floor(left % 60)).padStart(2, '0')}s` : 'Now';
}, 1000);

// Clipboard
const clipPool = [
  ['link', 'lintel.saswatasg.com'], ['file-text', 'Shipping the fix tonight'], ['image', 'Screenshot at 9.41 AM'],
  ['folder', 'Q4 roadmap.pdf'], ['terminal', 'git push origin main'], ['file-text', 'Kal subah 10 baje milte hain'], ['link', 'developer.apple.com/design'],
];
const clip = $('#clip');
let clipI = 4, clipVisible = false;
const clipItem = ([k, t]) => `<div class="it"><span class="k">${ic(k)}</span><span>${esc(t)}</span></div>`;
clip.innerHTML = clipPool.slice(0, 4).map(clipItem).join('');
setInterval(() => {
  if (!clipVisible) return;
  clip.insertAdjacentHTML('afterbegin', clipItem(clipPool[clipI++ % clipPool.length]));
  if (clip.children.length > 4) clip.lastElementChild.remove();
}, 2600);
onView(clip, () => (clipVisible = true), () => (clipVisible = false), .2);

// Todos
$$('#todos button').forEach(b => b.addEventListener('click', () => b.classList.toggle('done')));
setTimeout(() => $('#todos button').classList.add('done'), 2500);

// Timer
let tLeft = 300, tOn = true;
$('#tRing').addEventListener('click', () => { tOn = !tOn; $('#tState').textContent = tOn ? 'Running' : 'Paused'; });
setInterval(() => {
  if (!tOn) return;
  tLeft = tLeft <= 0 ? 300 : tLeft - 1;
  $('#tTime').textContent = tLeft === 0 ? 'Done' : fmt(tLeft);
  $('#tArc').style.strokeDashoffset = 282.7 * (1 - tLeft / 300);
}, 1000);

// Accent colours
const accents = [['#f9a06c', '#f9a06c'], ['#7d7aff', '#7d7aff'], ['#409cff', '#409cff'], ['#da8fff', '#da8fff'], ['#ff6482', '#ff6482'], ['#30db5b', '#30db5b']];
const accEl = $('#accents');
accEl.innerHTML = accents.map(([c], i) => `<button class="accent-dot${i ? '' : ' cur'}" style="background:${c}" aria-label="Accent colour ${i + 1}"></button>`).join('');
$$('button', accEl).forEach((b, i) => b.addEventListener('click', () => {
  document.documentElement.style.setProperty('--accent', accents[i][0]);
  document.documentElement.style.setProperty('--accent2', accents[i][1]);
  $$('button', accEl).forEach(x => x.classList.toggle('cur', x === b));
}));

/* ================= PRIVACY: everything flows into the Mac, nothing flows out ================= */
const sat = $('#sat'), orbit = sat.parentElement, wires = $('#wires'), macEl = $('.orbit .mac');
const satItems = ['Your voice', 'Meetings', 'Clipboard', 'Files', 'Scripts', 'Focus', 'Todos'];
sat.innerHTML = satItems.map(t => `<span>${t}</span>`).join('');
function placeSats() {
  const R = Math.min(orbit.clientWidth * .4, orbit.clientHeight * .4);
  [...sat.children].forEach((s, i) => {
    const a = i / satItems.length * Math.PI * 2 - Math.PI / 2;
    s.style.setProperty('--x', Math.cos(a) * R + 'px'); s.style.setProperty('--y', Math.sin(a) * R * .82 + 'px');
  });
  // A hairline from each label into the Mac.
  const o = orbit.getBoundingClientRect(), m = macEl.getBoundingClientRect();
  const mx = m.left - o.left + m.width / 2, my = m.top - o.top + m.height / 2;
  wires.setAttribute('viewBox', `0 0 ${o.width.toFixed(1)} ${o.height.toFixed(1)}`);
  wires.innerHTML = [...sat.children].map(s => {
    const r = s.getBoundingClientRect(), x = r.left - o.left + r.width / 2, y = r.top - o.top + r.height / 2;
    const qx = (x + mx) / 2 + (my - y) * .18, qy = (y + my) / 2 + (x - mx) * .18;
    return `<path class="w" d="M${x.toFixed(1)} ${y.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}"/>`;
  }).join('') + '<circle class="pk" r="3.5" cx="-20" cy="-20"/>';
}
let pkOn = false, pkI = 0, kept = 0;
async function packets() {
  while (pkOn) {
    const i = pkI++ % satItems.length, path = $$('.w', wires)[i], lab = sat.children[i];
    if (!path) { await sleep(400); continue; }
    lab.classList.add('on'); path.classList.add('on');
    const L = path.getTotalLength(), t0 = performance.now(), D = 900;
    await new Promise(res => {
      const f = t => {
        const p = Math.min(1, (t - t0) / D), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const pt = path.getPointAtLength(L * e), c = $('.pk', wires);
        if (c) { c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); }
        if (p < 1 && pkOn) requestAnimationFrame(f); else res();
      };
      requestAnimationFrame(f);
    });
    lab.classList.remove('on'); path.classList.remove('on');
    const c = $('.pk', wires); if (c) c.setAttribute('cx', -20);
    if (!pkOn) break;
    macEl.classList.remove('got'); void macEl.offsetWidth; macEl.classList.add('got');
    $('#kept').textContent = ++kept;
    await sleep(650);
  }
}
placeSats();
addEventListener('resize', placeSats);
onView(orbit, () => { placeSats(); if (!pkOn && !reduce) { pkOn = true; packets(); } }, () => (pkOn = false), .3);

/* ================= GALLERY: real screenshots, one at a time ================= */
const shotsEl = $('#shots'), shotFigs = $$('.shot', shotsEl), shotTabs = $$('.stabs button', shotsEl), stage2 = $('#stage2');
let shotI = 0, shotT = 0, shotsVisible = false, shotsHover = false;
function showShot(i, user) {
  shotI = (i + shotFigs.length) % shotFigs.length;
  shotFigs.forEach((f, j) => f.classList.toggle('on', j === shotI));
  shotTabs.forEach((b, j) => { b.classList.remove('cur'); b.setAttribute('aria-selected', j === shotI); });
  void shotsEl.offsetWidth;
  shotTabs[shotI].classList.add('cur');
  const strip = shotTabs[shotI].parentElement;
  if (user && strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: shotTabs[shotI].offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
  clearTimeout(shotT);
  const auto = shotsVisible && !shotsHover && !reduce;
  shotsEl.classList.toggle('play', auto);
  if (auto) shotT = setTimeout(() => showShot(shotI + 1), 5000);
}
shotTabs.forEach((b, j) => b.addEventListener('click', () => showShot(j, true)));
shotsEl.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { shotsHover = true; shotsEl.classList.add('held'); clearTimeout(shotT); } });
shotsEl.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { shotsHover = false; shotsEl.classList.remove('held'); showShot(shotI); } });
stage2.addEventListener('keydown', e => { if (e.key === 'ArrowRight') showShot(shotI + 1, true); if (e.key === 'ArrowLeft') showShot(shotI - 1, true); });
let swipeX = null;
stage2.addEventListener('touchstart', e => (swipeX = e.touches[0].clientX), { passive: true });
stage2.addEventListener('touchend', e => {
  if (swipeX === null) return;
  const dx = e.changedTouches[0].clientX - swipeX; swipeX = null;
  if (Math.abs(dx) > 40) showShot(shotI + (dx < 0 ? 1 : -1), true);
});
onView(shotsEl, () => { if (!shotsVisible) { shotsVisible = true; showShot(shotI); } }, () => { shotsVisible = false; clearTimeout(shotT); shotsEl.classList.remove('play'); }, .35);

/* ================= PRICING ================= */
const seg = $('#seg'), knob = $('#knob');
let bill = 'm';
function setBill(b, quiet) {
  bill = b;
  const btn = seg.querySelector(`[data-b="${b}"]`);
  $$('button', seg).forEach(x => x.classList.toggle('cur', x === btn));
  knob.style.width = btn.offsetWidth + 'px';
  knob.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
  if (quiet) return;
  $$('.plan [data-m]').forEach(el => (el.tagName === 'B' ? tweenPrice(el, el.dataset[b]) : (el.textContent = el.dataset[b])));
}
function tweenPrice(el, to) {
  const num = s => parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
  const from = num(el.textContent), end = num(to), t0 = performance.now(), D = 450;
  if (reduce) { el.textContent = to; return; }
  const f = t => {
    const p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3);
    el.textContent = p < 1 ? '$' + (from + (end - from) * e).toFixed(2) : to;
    if (p < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}
// Each card's notch opens to show what the plan adds; Pro's is listening.
const pnWave = makeWave($('#pnWave'), 9);
let pnClock = 0;
onView($('.plans'), () => {
  $$('.plan>.pn').forEach((n, i) => setTimeout(() => n.classList.add('open'), reduce ? 0 : 150 + i * 160));
  if (!reduce) setWave(pnWave, true);
  if (!pnClock) { let s = 12; pnClock = setInterval(() => ($('#pnT').textContent = fmt(++s)), 1000); }
}, () => { setWave(pnWave, false); clearInterval(pnClock); pnClock = 0; }, .2);
$$('button', seg).forEach(b => b.addEventListener('click', () => setBill(b.dataset.b)));
setBill('m', true);
addEventListener('resize', () => setBill(bill, true));
if (document.fonts) document.fonts.ready.then(() => setBill(bill, true));

/* ================= works with ================= */
$$('.ltrack').forEach(t => { const copy = t.querySelector('.lset').cloneNode(true); copy.setAttribute('aria-hidden', 'true'); t.appendChild(copy); });
onView($('#logos'), () => $('#logos').classList.add('run'), () => $('#logos').classList.remove('run'), 0);

/* ================= sticky button on phones ================= */
const mcta = $('#mcta'), heroCtas = $('.hero .ctas'), finalCard = $('.fcard');
let pastHero = false, atEnd = false;
const mctaSet = () => mcta.classList.toggle('on', pastHero && !atEnd);
new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; mctaSet(); }).observe(heroCtas);
new IntersectionObserver(([e]) => { atEnd = e.isIntersecting; mctaSet(); }, { threshold: .1 }).observe(finalCard);
})();
