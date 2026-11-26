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

/* ---------- download buttons ---------- */
const toast = document.createElement('div');
toast.className = 'toast'; toast.setAttribute('role', 'status');
document.body.appendChild(toast);
let toastT = 0;
function say(msg) {
  toast.textContent = msg; toast.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), 3200);
}
// Before launch, every download button leads to the nearest sign-up box instead.
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
    if (pre) pre.textContent = 'DOWNLOAD ON THE';
    if (a.dataset.ctaLabel) a.textContent = a.dataset.ctaLabel;
  } else if (PRE) {
    if (a.dataset.ctaLabel) a.textContent = 'Notify me at launch';
    a.addEventListener('click', e => { e.preventDefault(); focusNotify(); });
  } else if (a.dataset.ctaLabel || a.closest('#pricing')) {
    a.addEventListener('click', e => { e.preventDefault(); say('Lintel is in Apple’s review now and arrives on the Mac App Store soon.'); });
  }
});

/* ---------- launch sign-up ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DONE_KEY = 'lintel-notify';
const okText = 'Almost there: check your inbox and confirm your email. We’ll write once, the day Lintel is on the Mac App Store.';
function showMsg(form, kind, text) {
  const m = form.closest('.ctas').nextElementSibling;
  if (!m || !m.hasAttribute('data-msg')) return;
  m.className = 'nmsg ' + kind;
  m.innerHTML = (kind === 'ok' ? ic('circle-check') : '') + esc(text);
}
function markDone(text) {
  $$('[data-notify]').forEach(f => { f.classList.add('done'); showMsg(f, 'ok', text); });
}
try { if (PRE && localStorage.getItem(DONE_KEY)) markDone('You’re on the list. We’ll email you the day Lintel is on the Mac App Store.'); } catch (e) { /* storage blocked */ }
// Kit sends people back here after they confirm their email.
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
  input.addEventListener('input', () => { form.classList.remove('err'); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = input.value.trim();
    if (form.company.value) { markDone(okText); return; }
    if (!EMAIL_RE.test(email)) {
      form.classList.add('err'); showMsg(form, 'bad', 'Please enter a valid email address.'); input.focus(); return;
    }
    btn.disabled = true; btn.textContent = 'Sending…';
    const ok = await subscribe(email);
    btn.disabled = false; btn.textContent = 'Notify me at launch';
    if (ok) {
      try { localStorage.setItem(DONE_KEY, '1'); } catch (e2) { /* storage blocked */ }
      markDone(okText);
    } else {
      showMsg(form, 'bad', 'That didn’t go through. Please try again in a moment.');
    }
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

/* ---------- reveals ---------- */
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal]').forEach(el => {
  const sib = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
  const i = sib.indexOf(el);
  if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
  revealIO.observe(el);
});

/* ---------- trees ---------- */
const treeSVG = (stage, h) => stage === 0
  ? `<svg class="tr" data-stage="0" viewBox="0 0 64 64" style="width:${h}px;height:${h}px"><ellipse cx="32" cy="58" rx="13" ry="3" fill="#4a3426"/><rect x="27" y="49" width="10" height="9" rx="2" fill="#7a5238"/></svg>`
  : `<svg class="tr" data-stage="${stage}" viewBox="0 0 64 64" style="width:${h}px;height:${h}px"><ellipse cx="32" cy="58" rx="15" ry="3.5" fill="#4a3426"/><rect class="trunk" x="30" y="30" width="4" height="28" rx="2" fill="#9a6a48"/><circle class="leaf l1" cx="32" cy="30" r="8" fill="#2fb350"/><circle class="leaf l2" cx="24" cy="25" r="9" fill="#34c759"/><circle class="leaf l3" cx="40" cy="23" r="10" fill="#3fd46a"/><circle class="leaf l4" cx="32" cy="15" r="11" fill="#4ade80"/></svg>`;
$$('[data-tree]').forEach(el => { const [s, h] = el.dataset.tree.split(':').map(Number); el.innerHTML = treeSVG(s, h); });
const DAYS = ['T', 'F', 'S', 'S', 'M', 'T', 'W'];
$$('[data-garden]').forEach(g => {
  const k = +(g.dataset.size || 1);
  g.innerHTML = g.dataset.garden.split(',').map(Number)
    .map((s, i) => `<div class="d"${i === 6 ? ' style="color:#fff"' : ''}>${treeSVG(s, Math.round((s ? 28 + s * 5 : 26) * k))}<span>${DAYS[i]}</span></div>`).join('');
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
    w.bars.forEach((b, i) => {
      const v = Math.abs(Math.sin(t / 170 + i * .9 + w.phase) * Math.sin(t / 430 + i * 1.7));
      b.style.height = 16 + v * 84 + '%';
    });
  }
  waveRAF = any ? requestAnimationFrame(waveLoop) : 0;
}
function setWave(w, live) {
  w.live = live;
  if (!live) w.bars.forEach(b => (b.style.height = '22%'));
  else if (!waveRAF) waveRAF = requestAnimationFrame(waveLoop);
}

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
  meetings: ['Meetings', '', 'Both sides of the call, written as you talk. Lines in Bengali are rewritten in Bengali script.'],
  todos: ['Todos', '5 today', 'Your todos, synced with Reminders, a glance away.'],
  grove: ['Grove', '7-day streak', 'A tree grows while you focus, and distracting apps and sites stay blocked.'],
  usage: ['AI limits', 'Updated just now', 'See how much is left on your AI coding plans, with a heads-up before you run out.'],
  clipboard: ['Clipboard', '6 items', 'Everything you copied, a click away. Copies marked as passwords are never kept.'],
  apps: ['Launcher', 'Apps, folders, websites and Shortcuts', 'Your apps, folders, websites and Shortcuts, one click away.'],
  shelf: ['Shelf', '3 files', 'Drop files on the notch and drag them out later, or AirDrop them.'],
};
function tabSet(t) {
  curTab = t;
  $$('#Ltabs .tb button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  $$('#Ltabs .pane').forEach(p => p.classList.toggle('on', p.dataset.pane === t));
  $('#iTitle').textContent = TABS[t][0];
  $('#iSub').textContent = TABS[t][1];
}
const WINS = ['wMail', 'wCall', 'wBrowser', 'wNotes'];
const wins = (...ids) => WINS.forEach(id => $('#' + id).classList.toggle('on', ids.includes(id)));
const dCur = $('#dCur');
const cur = (x, y) => { dCur.style.left = x + 'px'; dCur.style.top = y + 'px'; };
const click = async () => { dCur.classList.add('click'); await sleep(160); dCur.classList.remove('click'); };
const iWave = makeWave($('#iWave'), 16);

let cleanups = [];
const every = (fn, ms) => { const id = setInterval(fn, ms); cleanups.push(() => clearInterval(id)); };
const clean = () => { cleanups.forEach(f => f()); cleanups = []; setWave(iWave, false); };

function resetDesk() {
  $('#dSay').classList.remove('on'); $('#dKeys').classList.remove('on');
  $('#wCall').classList.remove('presenting');
  $$('#wCall .ct').forEach(t => t.classList.remove('talk'));
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
  let m = 14 * 60; every(() => { m--; $('#pNext').textContent = `IN ${Math.ceil(m / 60)}M`; }, 1000);
  await sleep(1300); if (!ok()) return;
  cur(470, 210);
}
async function sVoice(ok) {
  resetDesk();
  islSet('closed');
  wins('wMail');
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
  await click();
  $('#dKeys').classList.add('on');
  await sleep(500); if (!ok()) return;
  body.textContent = words.join(' ');
  body.classList.remove('flash'); void body.offsetWidth; body.classList.add('flash');
  await sleep(500); $('#dKeys').classList.remove('on');
  await sleep(900); if (!ok()) return;
  islSet('closed');
}
async function sMeetings(ok) {
  resetDesk();
  wins('wCall');
  tabSet('meetings');
  const lns = $$('#Ltabs [data-pane=meetings] .ln'), ref = $('#pRef span');
  lns.forEach(l => l.classList.remove('in'));
  ref.textContent = 'Aami report ta Friday er modhye pathiye debo.'; ref.removeAttribute('lang');
  cur(980, 600);
  islSet('tabs');
  let secs = 42; every(() => ($('#pMeetClock').textContent = fmt(++secs)), 1000);
  const talk = (who) => { $('#dThem').classList.toggle('talk', who === 'them'); $('#dMe').classList.toggle('talk', who === 'me'); };
  const seq = [['them', 0, 700], ['me', 1, 1500], ['them', 2, 1500]];
  for (const [who, i, wait] of seq) {
    talk(who); await sleep(wait); if (!ok()) return;
    lns[i].classList.add('in');
  }
  talk(null);
  await sleep(900); if (!ok()) return;
  ref.classList.add('fade'); await sleep(380); if (!ok()) return;
  ref.textContent = 'আমি রিপোর্টটা ফ্রাইডের মধ্যে পাঠিয়ে দেব।'; ref.setAttribute('lang', 'bn');
  ref.classList.remove('fade');
}
function sPrompter(ok) {
  resetDesk();
  wins('wCall'); $('#wCall').classList.add('presenting');
  $('#dMe').classList.add('talk');
  islSet('prompt');
  cur(980, 640);
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
async function sGrove(ok) {
  resetDesk();
  wins('wBrowser');
  tabSet('grove');
  islSet('tabs');
  cur(700, 600);
  let left = 31 * 60 + 50, p = .64;
  const step = () => {
    $('#pGrove').textContent = fmt(left); $('#dLeft').textContent = fmt(left) + ' left';
    $('#pRing').style.strokeDashoffset = 282.7 * (1 - p); $('#dLeftBar').style.width = p * 100 + '%';
    left--; p = Math.min(1, p + .004);
  };
  step(); every(step, 1000);
}
async function sClipboard(ok) {
  resetDesk();
  wins('wNotes');
  tabSet('clipboard');
  islSet('tabs');
  const sel = $('#dSel'); sel.style.background = 'transparent';
  cur(470, 440);
  await sleep(900); if (!ok()) return;
  sel.style.background = '';
  await sleep(500); if (!ok()) return;
  const keys = $('#dKeys'); keys.innerHTML = '<b>⌘</b><b>C</b>'; keys.classList.add('on');
  await sleep(600); keys.classList.remove('on'); if (!ok()) return;
  const box = $('#pClip');
  box.insertAdjacentHTML('afterbegin', `<div class="cc new"><div class="src"><i style="background:#ffd34d"></i>Notes<em>now</em></div><b>Studio address: 18 Harbour Lane, 2nd floor</b></div>`);
  while (box.children.length > 5) box.lastElementChild.remove();
  await sleep(400); keys.innerHTML = '<b>⌘</b><b>V</b>';
  cur(560, 180);
}
const TOUR = [
  { t: 'home', title: 'Home', d: 6000, run: sHome },
  { t: 'voice', title: 'Voice typing', text: 'Hold ⌥ and speak. Let go, and your words are ready to paste into any app.', d: 9000, run: sVoice },
  { t: 'meetings', title: 'Meeting notes', d: 8000, run: sMeetings },
  { t: 'prompt', title: 'Teleprompter', text: 'Your script scrolls right under the camera, so you keep eye contact. Nobody on the call sees it.', d: 6500, run: sPrompter },
  { t: 'grove', title: 'Focus', d: 6000, run: sGrove },
  { t: 'clipboard', title: 'Clipboard', d: 5500, run: sClipboard },
];
const stepsEl = $('#steps');
stepsEl.innerHTML = TOUR.map((s, i) => `<button aria-label="${s.title}"><i></i></button>`).join('');
const stepBtns = $$('button', stepsEl);
let ti = 0, tRun = 0, tTimer = 0, playing = !reduce, demoVisible = false;
const tourTx = $('#tourTx'), pp = $('#tourPP');
function setText(title, text) { tourTx.innerHTML = `<b>${esc(title)}</b>${esc(text)}`; }
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
// Clicking a tab in the notch takes over the demo, like the real thing.
$$('#Ltabs .tb button').forEach(b => b.addEventListener('click', () => {
  if (playing) setPlaying(false);
  tRun++; clean(); resetDesk();
  const t = b.dataset.tab;
  tabSet(t); islSet('tabs');
  wins(...({ meetings: ['wCall'], grove: ['wBrowser'], clipboard: ['wNotes'] }[t] || []));
  stepBtns.forEach(x => x.classList.remove('cur', 'done'));
  setText(TABS[t][0], TABS[t][2]);
}));
isl.addEventListener('pointerenter', () => {
  if (islMode !== 'closed' || playing) return;
  islSet('tabs'); tabSet(curTab);
});
$('#watch').addEventListener('click', () => { setPlaying(true); setTimeout(() => go(0), 500); });
onView(device, () => { if (!demoVisible) { demoVisible = true; go(ti); } }, () => { demoVisible = false; clearTimeout(tTimer); }, .25);
tabSet('home');

// The screen tilts back as it rises into view.
let tiltQueued = false;
function tilt() {
  tiltQueued = false;
  nav.classList.toggle('solid', scrollY > 8 || sheet.classList.contains('open'));
  if (reduce) return;
  const r = device.getBoundingClientRect();
  const p = clamp(1 - (r.top - innerHeight * .1) / (innerHeight * .75), 0, 1);
  const e = 1 - Math.pow(1 - p, 3);
  device.style.setProperty('--tilt', (16 * (1 - e)).toFixed(2) + 'deg');
  device.style.setProperty('--zoom', (.93 + .07 * e).toFixed(3));
}
addEventListener('scroll', () => { if (!tiltQueued) { tiltQueued = true; requestAnimationFrame(tilt); } }, { passive: true });
tilt();

/* ================= VOICE TYPING ================= */
const samples = [
  { to: 'Maya Chen', sub: 'Design review', text: 'Hi Maya, can we push the design review to Thursday? I’d like the team to see the new onboarding flow first.' },
  { to: 'Rohan', sub: 'Aaj ki call', text: 'Yaar, main thoda late ho jaoonga. Sabko bata dena ki call paanch baje start hogi.' },
  { to: 'Ankita', sub: 'আজকের প্ল্যান', text: 'আজকে আমি অফিসে একটু দেরি করে পৌঁছাব, তুমি প্লিজ ক্লায়েন্টকে একটা মেইল করে দিও।' },
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
function startTalk() {
  if (holding) return;
  holding = true; nHeard = 0; heard.innerHTML = '';
  key.classList.add('down');
  const t0 = performance.now();
  $('#vT').textContent = '0:00';
  vMiniState('rec'); setWave(vWave, true);
  vClock = setInterval(() => ($('#vT').textContent = fmt((performance.now() - t0) / 1000)), 250);
  const step = () => {
    if (!holding) return;
    if (nHeard < vWords.length) { nHeard++; renderHeard(); }
    vTimer = setTimeout(step, 240 + Math.random() * 150);
  };
  vTimer = setTimeout(step, 340);
}
async function stopTalk() {
  if (!holding) return;
  holding = false;
  key.classList.remove('down'); clearTimeout(vTimer); clearInterval(vClock); setWave(vWave, false);
  if (nHeard === 0) { vMiniState('idle'); heard.textContent = 'Hold a little longer, and talk.'; return; }
  const said = vWords.slice(0, nHeard).join(' ');
  heard.textContent = said;
  vMiniState('copied');
  await sleep(650); paste.classList.add('on');
  await sleep(550);
  mBody.textContent = said;
  mBody.classList.remove('flash'); void mBody.offsetWidth; mBody.classList.add('flash');
  await sleep(450); paste.classList.remove('on');
  await sleep(900);
  if (!holding) vMiniState('idle');
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
$$('#samples button').forEach((b, i) => b.addEventListener('click', () => { if (holding) return; pickSample(i); autoTalk(); }));
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

/* ================= LANGUAGES ================= */
const sentences = [
  [['bn', 'আমার মনে হয় ফিচারটা খুব কাজের হবে,'], ['en', 'but we need to test it properly before the release.']],
  [['hi', 'Kal ki meeting cancel karo,'], ['en', 'we’ll do it on Monday.']],
  [['en', 'Can you send me the slides?'], ['bn', 'আমি আজ রাতে দেখে নেব।']],
  [['hi', 'Yaar, main thoda late ho jaoonga.'], ['en', 'Start the call without me.']],
];
const tagText = { hi: 'Hindi · English letters', bn: 'Bengali · Bengali script', en: 'English' };
const sent = $('#sent'), sdots = $('#sdots');
sdots.innerHTML = sentences.map((_, i) => `<button aria-label="Example ${i + 1}"></button>`).join('');
let sentI = 0, riverRun = 0;
$$('button', sdots).forEach((b, i) => b.addEventListener('click', () => { sentI = i; river(++riverRun); }));
async function river(run) {
  while (run === riverRun) {
    const S = sentences[sentI];
    $$('button', sdots).forEach((b, i) => b.classList.toggle('cur', i === sentI));
    sent.innerHTML = S.map(([l, t]) => `<span class="run ${l}" lang="${l}"><span class="tag ${l}">${tagText[l]}</span>` +
      t.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join('') + '<i class="under"></i></span>').join('');
    sent.style.opacity = 1;
    for (const r of $$('.run', sent)) {
      for (const w of $$('.w', r)) { await sleep(reduce ? 0 : 105); if (run !== riverRun) return; w.classList.add('lit'); }
      r.classList.add('done');
      await sleep(260);
    }
    await sleep(2800); if (run !== riverRun) return;
    sent.style.opacity = 0; await sleep(450);
    sentI = (sentI + 1) % sentences.length;
  }
}
onView($('.river'), () => river(++riverRun), () => riverRun++, .4);
$$('.typed').forEach(p => {
  p.innerHTML = graphemes(p.dataset.text).map(g => `<span class="c">${esc(g)}</span>`).join('');
  let done = false;
  onView(p, async () => {
    if (done) return; done = true;
    for (const c of $$('.c', p)) { c.classList.add('on'); if (!reduce) await sleep(16); }
  }, null, .6);
});

/* ================= MEETINGS ================= */
const cMini = $('#cMini'), callScr = $('#callScr'), cCur = $('#cCur'), linesEl = $('#lines'), panel = $('#panel');
const mLines = [
  { who: 'them', text: 'So the beta goes out on Friday, right?' },
  { who: 'me', text: 'Haan, bas final testing baaki hai.' },
  { who: 'them', live: 'Aami report ta Friday er modhye pathiye debo.', text: 'আমি রিপোর্টটা ফ্রাইডের মধ্যে পাঠিয়ে দেব।' },
  { who: 'me', text: 'Perfect. Let’s lock the date today.' },
  { who: 'them', text: 'And I’ll update the release notes tonight.' },
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
    el.innerHTML = `<div class="who ${L.who}">${L.who === 'them' ? 'THEM' : 'ME'}</div><div class="txt"></div>`;
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
      txt.innerHTML = `<span class="swap"><span class="a">${esc(L.live)}</span><span class="b" lang="bn">${esc(L.text)}</span></span><span class="ref">${ic('check', 'width:12px;height:12px')}Bengali model</span>`;
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

/* ================= TELEPROMPTER ================= */
const script = 'Hi everyone, and thanks for joining. Today I want to show you how Lintel turns the notch into the most useful spot on your Mac. Watch the words right under the camera: you keep eye contact, and nobody on the call can see your notes. Set your own pace, or let it follow your voice. Hover to pause at any time, and pick up right where you left off. That’s it. Let’s get started.';
const ptxt = $('#ptxt'), prom = $('#prom'), speed = $('#speed'), followSw = $('#follow');
ptxt.innerHTML = script.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ');
const pWords = $$('.w', ptxt);
const READ = 58;
let pOff = -READ, pLast = 0, pHover = false, pFollow = false, pWord = 0, pNext = 0, pOn = false;
function pFrame(t) {
  if (!pOn) return;
  const dt = Math.min(.05, (t - (pLast || t)) / 1000); pLast = t;
  const lh = parseFloat(getComputedStyle(ptxt).lineHeight) || 38;
  if (!pHover && !(reduce && !pFollow)) {
    if (pFollow) {
      if (t >= pNext) {
        if (pWord < pWords.length) {
          const w = pWords[pWord++]; w.classList.add('said');
          pNext = t + 210 + Math.random() * 170 + (/[.,:!?]$/.test(w.textContent) ? 420 : 0);
        } else if (t > pNext + 1200) { pWord = 0; pOff = -READ; pWords.forEach(w => w.classList.remove('said')); }
      }
      const c = pWords[Math.max(0, pWord - 1)];
      pOff += (c.offsetTop - READ + 4 - pOff) * Math.min(1, dt * 3.5);
    } else {
      const perLine = pWords.length / Math.max(1, ptxt.offsetHeight / lh);
      pOff += (+speed.value / 60) / perLine * lh * dt;
      if (pOff > ptxt.offsetHeight - READ + 20) pOff = -READ;
    }
  }
  ptxt.style.transform = `translateY(${-pOff}px)`;
  requestAnimationFrame(pFrame);
}
speed.addEventListener('input', () => ($('#wpm').textContent = speed.value + ' words a minute'));
followSw.addEventListener('click', () => {
  pFollow = followSw.getAttribute('aria-checked') !== 'true';
  followSw.setAttribute('aria-checked', pFollow);
  prom.classList.toggle('fixed', !pFollow);
  speed.disabled = pFollow;
  pWords.forEach(w => w.classList.remove('said'));
  pWord = Math.max(0, pWords.findIndex(w => w.offsetTop - READ >= pOff - 4));
  pWords.slice(0, pWord).forEach(w => w.classList.add('said'));
});
prom.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') pHover = true; });
prom.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') pHover = false; });
prom.addEventListener('click', e => { if (e.pointerType !== 'mouse') pHover = !pHover; });
onView($('#bz'), () => { if (!pOn) { pOn = true; pLast = 0; requestAnimationFrame(pFrame); } }, () => (pOn = false), .4);

/* ================= FOCUS ================= */
const gArc = $('#gArc'), gTime = $('#gTime'), gState = $('#gState'), gStart = $('#gStart');
const gTree = () => $('#gTreeBox svg');
const block = $('#block'), fake = $('#fake');
const fakes = {
  docs: '<i style="width:42%;height:20px"></i><i></i><i style="width:92%"></i><i style="width:86%"></i><i style="width:58%"></i><div style="height:8px"></div><i style="width:95%"></i><i style="width:88%"></i><i style="width:72%"></i>',
  videos: '<div class="vid"></div><i style="width:70%"></i><i style="width:44%"></i>',
  feed: '<div class="post"></div><div class="post"></div><div class="post"></div>',
};
let gMin = 25, gRunning = false, gLeft = 1500, gTotal = 1500, gInt = 0, passUntil = 0, tab = 'docs';
function setTab(t) {
  tab = t;
  $$('#btabs button').forEach(b => b.classList.toggle('cur', b.dataset.t === t));
  fake.innerHTML = fakes[t]; updateBlock();
}
function updateBlock() {
  block.classList.toggle('on', gRunning && tab !== 'docs' && Date.now() > passUntil);
  $('#bTitle').textContent = tab === 'videos' ? 'Videos can wait' : 'Your feed can wait';
}
function gRender() {
  gTime.textContent = fmt(gLeft);
  const frac = gTotal ? gLeft / gTotal : 1;
  gArc.style.strokeDashoffset = gRunning ? 282.7 * frac : 282.7;
  if (gRunning) gTree().dataset.stage = Math.min(4, 1 + Math.floor((1 - frac) * 3.4));
  $('#bLeft').textContent = fmt(gLeft) + ' left';
  $('#bBar').style.width = (1 - frac) * 100 + '%';
  updateBlock();
}
const hintIdle = 'Start a session, then try opening Videos or Feed. The demo runs a minute every second.';
function gStop(done) {
  gRunning = false; clearInterval(gInt);
  gStart.textContent = 'Start';
  if (done) {
    gState.textContent = 'A NEW TREE IN YOUR GARDEN'; gTree().dataset.stage = 4; gArc.style.strokeDashoffset = 0;
    const today = $('#garden').lastElementChild;
    today.innerHTML = treeSVG(4, 64) + '<span>W</span>';
    $('#gStreak').textContent = '8 days';
    setTimeout(() => { if (!gRunning) { gState.textContent = 'READY TO FOCUS'; gTree().dataset.stage = 0; gLeft = gTotal = gMin * 60; gRender(); } }, 3500);
  } else {
    gState.textContent = 'READY TO FOCUS'; gTree().dataset.stage = 0; gLeft = gTotal = gMin * 60; gRender();
  }
  $('#fHint').textContent = hintIdle;
}
gStart.addEventListener('click', () => {
  if (gRunning) return gStop(false);
  gTotal = gLeft = gMin * 60; gRunning = true; passUntil = 0;
  gStart.textContent = 'Give up'; gState.textContent = 'GROWING';
  $('#fHint').textContent = 'Now try opening Videos or Feed.';
  gRender();
  gInt = setInterval(() => { gLeft -= 15; if (gLeft <= 0) { gLeft = 0; gRender(); gStop(true); } else gRender(); }, 250);
});
$$('#durs [data-m]').forEach(b => b.addEventListener('click', () => {
  if (gRunning) return;
  gMin = +b.dataset.m; $$('#durs [data-m]').forEach(x => x.classList.toggle('cur', x === b));
  gLeft = gTotal = gMin * 60; gRender();
}));
$$('#btabs button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.t)));
$('#bBack').addEventListener('click', () => setTab('docs'));
$('#bPass').addEventListener('click', () => {
  passUntil = Date.now() + 8000; updateBlock();
  $('#fHint').textContent = 'One-minute pass (8 seconds in this demo). The block comes back after it.';
  setTimeout(updateBlock, 8100);
});
onView($('#garden'), () => $('#garden').classList.add('in'), null, .5);
setTab('docs'); gRender();

/* ================= EVERYTHING ================= */
const tracks = [
  { t: 'Golden Hour', a: 'Lumen Drift', c1: '#ff7a59', c2: '#a63fd1', len: 213 },
  { t: 'Night Swim', a: 'Halcyon Park', c1: '#3fb5ff', c2: '#5b3df5', len: 184 },
  { t: 'Paper Planes', a: 'The Quiet Hours', c1: '#ffd166', c2: '#ef476f', len: 221 },
];
const music = $('#music');
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

const nStart = Date.now();
setInterval(() => {
  const left = Math.max(0, 14 * 60 - (Date.now() - nStart) / 1000);
  $('#nIn').textContent = left > 0 ? `IN ${Math.floor(left / 60)}M ${String(Math.floor(left % 60)).padStart(2, '0')}S` : 'NOW';
}, 1000);

const clipPool = [
  ['link', 'lintel.saswatasg.com'], ['file-text', 'Shipping the fix tonight'], ['monitor', 'Screenshot at 9.41 AM'],
  ['folder', 'Q4 roadmap.pdf'], ['file-text', 'আজকের মিটিং ৫টায়'], ['app-window', 'git push origin main'],
  ['file-text', 'Kal subah 10 baje milte hain'], ['link', 'developer.apple.com/design'],
];
const clip = $('#clip');
let clipI = 5, clipVisible = false;
const clipItem = ([k, t]) => `<div class="it"><span class="k">${ic(k)}</span><span>${esc(t)}</span></div>`;
clip.innerHTML = clipPool.slice(0, 5).map(clipItem).join('');
setInterval(() => {
  if (!clipVisible) return;
  clip.insertAdjacentHTML('afterbegin', clipItem(clipPool[clipI++ % clipPool.length]));
  if (clip.children.length > 6) clip.lastElementChild.remove();
}, 2600);
onView(clip, () => (clipVisible = true), () => (clipVisible = false), .2);

$$('#todos button').forEach(b => b.addEventListener('click', () => b.classList.toggle('done')));
setTimeout(() => $('#todos button').classList.add('done'), 2500);

let tLeft = 300, tOn = true;
$('#tRing').addEventListener('click', () => { tOn = !tOn; $('#tState').textContent = tOn ? 'Running' : 'Paused'; });
setInterval(() => {
  if (!tOn) return;
  tLeft = tLeft <= 0 ? 300 : tLeft - 1;
  $('#tTime').textContent = tLeft === 0 ? 'Done' : fmt(tLeft);
  $('#tArc').style.strokeDashoffset = 282.7 * (1 - tLeft / 300);
}, 1000);

const limits = [
  { n: 'Claude', p: 62, r: 'resets 3:40 PM', c: '#d97757' },
  { n: 'Codex', p: 81, r: 'resets Friday', c: '#8b7bff' },
  { n: 'OpenCode Go', p: 44, r: 'resets in 2h', c: '#34c759' },
];
const lims = $('#lims');
lims.innerHTML = limits.map(l => `<div><div class="t">${l.n}<span></span></div><div class="b"><i style="background:${l.c};width:0"></i></div></div>`).join('');
const limRender = () => [...lims.children].forEach((el, i) => {
  el.querySelector('i').style.width = limits[i].p + '%';
  el.querySelector('span').textContent = `${limits[i].p}% · ${limits[i].r}`;
});
onView(lims, limRender, null, .4);
setInterval(() => { limits.forEach(l => { l.p -= Math.random() < .5 ? 1 : 0; if (l.p < 6) l.p = 96; }); limRender(); }, 2800);

const cpu = Array.from({ length: 40 }, () => 15 + Math.random() * 20), mem = Array.from({ length: 40 }, () => 40 + Math.random() * 5);
const pathOf = (a, max, h) => a.map((v, i) => `${i ? 'L' : 'M'}${(i / (a.length - 1) * 200).toFixed(1)} ${(h - v / max * (h - 6) - 3).toFixed(1)}`).join(' ');
function monTick() {
  cpu.push(clamp(cpu[cpu.length - 1] + (Math.random() - .5) * 22, 4, 96)); cpu.shift();
  mem.push(clamp(mem[mem.length - 1] + (Math.random() - .5) * 2, 30, 60)); mem.shift();
  const d = pathOf(cpu, 100, 60);
  $('#cpuP').setAttribute('d', d); $('#cpuA').setAttribute('d', d + ' L200 60 L0 60 Z');
  $('#memP').setAttribute('d', pathOf(mem, 64, 40));
  $('#cpuV').textContent = Math.round(cpu[cpu.length - 1]) + '%';
  $('#memV').textContent = (mem[mem.length - 1] / 4).toFixed(1) + ' GB';
}
monTick(); setInterval(monTick, 700);

const acts = [
  [ic('battery-charging', 'color:var(--green)') + 'Charging', '82%'],
  [ic('timer', 'color:var(--amber)') + 'Timer done', '25:00'],
  [ic('video', 'color:var(--green)') + 'Design review', 'in 1 min'],
  [ic('circle-check', 'color:#d97757') + 'Claude Code', 'finished'],
];
const actN = $('#actN');
let actI = 0, actVisible = false;
async function actCycle() {
  while (actVisible) {
    const [l, r] = acts[actI++ % acts.length];
    $('#actL').innerHTML = l; $('#actR').textContent = r;
    actN.classList.add('open'); await sleep(2400);
    actN.classList.remove('open'); await sleep(900);
  }
}
onView(actN.parentElement, () => { if (!actVisible) { actVisible = true; actCycle(); } }, () => (actVisible = false), .4);

// Shelf: files dropped here stay on this page; nothing is uploaded.
const shelf = $('#shelf');
['dragenter', 'dragover'].forEach(n => shelf.addEventListener(n, e => { e.preventDefault(); shelf.classList.add('over'); }));
['dragleave', 'drop'].forEach(n => shelf.addEventListener(n, () => shelf.classList.remove('over')));
shelf.addEventListener('drop', e => {
  e.preventDefault();
  [...(e.dataTransfer.files || [])].slice(0, 4).forEach(f => shelf.insertAdjacentHTML('beforeend', `<div class="f">${ic('file-text')}${esc(f.name)}</div>`));
  while (shelf.children.length > 6) shelf.firstElementChild.remove();
});

const accents = [['#8b7bff', '#b8abff'], ['#ff6fae', '#ffadd0'], ['#34c759', '#86e6a0'], ['#ffb340', '#ffd28a'], ['#3fb5ff', '#9bd8ff'], ['#ff5b5b', '#ff9e9e']];
const accEl = $('#accents');
accEl.innerHTML = accents.map(([c], i) => `<button class="accent-dot${i ? '' : ' cur'}" style="background:${c}" aria-label="Accent colour ${i + 1}"></button>`).join('');
$$('button', accEl).forEach((b, i) => b.addEventListener('click', () => {
  document.documentElement.style.setProperty('--accent', accents[i][0]);
  document.documentElement.style.setProperty('--accent2', accents[i][1]);
  $$('button', accEl).forEach(x => x.classList.toggle('cur', x === b));
}));

/* ================= PRIVACY ================= */
const sat = $('#sat');
const satItems = ['Your voice', 'Meetings', 'Clipboard', 'Notes', 'Scripts', 'Focus', 'Todos'];
sat.innerHTML = satItems.map(t => `<span>${t}</span>`).join('');
let satSpin = 0, satOn = false, satLast = 0;
function placeSats() {
  const o = sat.parentElement, R = Math.min(o.clientWidth * .4, o.clientHeight * .4);
  [...sat.children].forEach((s, i) => {
    const a = i / satItems.length * Math.PI * 2 - Math.PI / 2 + satSpin;
    s.style.setProperty('--x', Math.cos(a) * R + 'px'); s.style.setProperty('--y', Math.sin(a) * R * .82 + 'px');
  });
}
function satFrame(t) {
  if (!satOn) return;
  if (!reduce) satSpin += Math.min(50, t - (satLast || t)) / 1000 * .16;
  satLast = t; placeSats(); requestAnimationFrame(satFrame);
}
placeSats();
addEventListener('resize', placeSats);
onView(sat.parentElement, () => { if (!satOn) { satOn = true; satLast = 0; requestAnimationFrame(satFrame); } }, () => (satOn = false), .2);

/* ================= GALLERY ================= */
const gal = $('#gal');
const galStep = d => gal.scrollBy({ left: d * (gal.querySelector('figure').offsetWidth + 16), behavior: 'smooth' });
$('#gPrev').addEventListener('click', () => galStep(-1));
$('#gNext').addEventListener('click', () => galStep(1));

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
  $$('.plan [data-m]').forEach(el => {
    if (el.tagName === 'B') {
      el.classList.add('swap');
      setTimeout(() => { el.textContent = el.dataset[b]; el.classList.remove('swap'); }, 200);
    } else el.textContent = el.dataset[b];
  });
}
$$('button', seg).forEach(b => b.addEventListener('click', () => setBill(b.dataset.b)));
setBill('m', true);
addEventListener('resize', () => setBill(bill, true));
if (document.fonts) document.fonts.ready.then(() => setBill(bill, true));

/* ================= sticky download button on phones ================= */
const mcta = $('#mcta'), heroCtas = $('.hero .ctas'), finalCard = $('.fcard');
let pastHero = false, atEnd = false;
const mctaSet = () => mcta.classList.toggle('on', pastHero && !atEnd);
new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; mctaSet(); }).observe(heroCtas);
new IntersectionObserver(([e]) => { atEnd = e.isIntersecting; mctaSet(); }, { threshold: .1 }).observe(finalCard);
})();
