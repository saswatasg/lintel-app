/* Lintel home page: the notch at the top is Lintel, and every demo below is live. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoverless = matchMedia('(hover: none)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const graphemes = s => (window.Intl && Intl.Segmenter)
  ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].map(x => x.segment)
  : Array.from(s);
const onView = (el, on, off, threshold = .3) =>
  new IntersectionObserver(es => es.forEach(e => { const f = e.isIntersecting ? on : off; if (f) f(); }), { threshold }).observe(el);
const icon = (id, size = 15, color = 'currentColor') => `<svg width="${size}" height="${size}" style="color:${color};flex:none"><use href="#${id}"/></svg>`;

/* ---------- clock ---------- */
const clock = $('#clock');
const tick = () => {
  const d = new Date();
  clock.textContent = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
tick(); setInterval(tick, 15000);

/* ---------- headlines and reveals ---------- */
$$('h2.rise').forEach(h => {
  h.innerHTML = h.textContent.trim().split(/\s+/)
    .map((w, i) => `<span class="w"><span style="transition-delay:${i * 55}ms">${esc(w)}</span></span>`).join(' ');
});
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}), { threshold: .14, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal]').forEach(el => {
  const sib = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
  const i = sib.indexOf(el);
  if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
  revealIO.observe(el);
});
$$('h2.rise').forEach(el => revealIO.observe(el));
setTimeout(() => $('.hero h1').classList.add('in'), 150);

/* cursor spotlight on cards */
addEventListener('pointermove', e => {
  const c = e.target.closest && e.target.closest('.card');
  if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', e.clientX - r.left + 'px');
  c.style.setProperty('--my', e.clientY - r.top + 'px');
}, { passive: true });

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

/* ---------- the island ---------- */
const island = $('#island'), stage = $('#stage');
const views = {};
$$('.view', stage).forEach(v => (views[v.dataset.v] = v));
$$('a', island).forEach(a => a.setAttribute('tabindex', '-1'));
const mbL = $('.mb-left'), mbR = $('.mb-right');
const want = { menu: false, demo: null, hero: null, section: false };
let shown = null, bump = 0;

function size() {
  const v = views[shown];
  let w = +v.dataset.w, s = 1;
  const h = +v.dataset.h;
  if (h <= 44) {
    // Small views sit in the menu bar: leave room for what's on either side.
    const side = Math.max(mbL.getBoundingClientRect().right, innerWidth - mbR.getBoundingClientRect().left);
    w = Math.max(120, Math.min(w, innerWidth - 2 * side - 12));
    v.style.width = w + 'px';
  } else s = Math.min(1, (innerWidth - 16) / w);
  island.style.setProperty('--w', (w + (h <= 44 ? bump : 0)) * s + 'px');
  island.style.setProperty('--h', h * s + 'px');
  island.style.setProperty('--r', (h > 70 ? 30 : h > 44 ? 22 : 14) * Math.max(s, .6) + 'px');
  stage.style.setProperty('--s', s);
  stage.style.width = w + 'px';
  stage.style.height = h + 'px';
  island.classList.toggle('big', h > 44);
}
function render() {
  const name = want.menu ? 'menu' : want.demo || want.hero || (want.section ? 'section' : 'notch');
  if (name !== shown) {
    if (shown) views[shown].classList.remove('on');
    views[name].classList.add('on');
    shown = name;
  }
  size();
}
function pulse() { bump = 34; render(); setTimeout(() => { bump = 0; render(); }, 360); }
addEventListener('resize', () => { render(); syncPanel(); placeSats(); setBill(bill, true); });

let menuT = 0;
island.addEventListener('pointerenter', e => {
  if (e.pointerType !== 'mouse') return;
  clearTimeout(menuT); want.menu = true; render();
});
island.addEventListener('pointerleave', e => {
  if (e.pointerType !== 'mouse') return;
  menuT = setTimeout(() => { want.menu = false; render(); }, 220);
});
island.addEventListener('click', e => {
  if (e.target.closest('a')) { want.menu = false; render(); return; }
  if (hoverless) { want.menu = !want.menu; render(); }
});

let actOwner = null;
function setActivity(owner, left, right) {
  actOwner = owner;
  $('#iaL').innerHTML = left; $('#iaR').textContent = right;
  if (!want.demo || want.demo === 'activity') { want.demo = 'activity'; render(); }
}
function activityRight(owner, text) { if (actOwner === owner) $('#iaR').textContent = text; }
function clearActivity(owner) {
  if (actOwner !== owner) return;
  actOwner = null;
  if (want.demo === 'activity') { want.demo = null; render(); }
}

/* ---------- scroll: hero scenes, then a label for each section ---------- */
const hero = $('#hero');
const sections = $$('section[data-island]');
let heroActive = null, curSec = null, scrollQueued = false;
function onScroll() {
  scrollQueued = false;
  const heroOn = scrollY < hero.offsetHeight * .42;
  const mid = innerHeight * .42;
  let sec = null, p = 0;
  for (const s of sections) {
    const r = s.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) { sec = s; p = (mid - r.top) / r.height; break; }
  }
  if (heroOn !== heroActive) { heroActive = heroOn; heroOn ? heroGo(heroIndex) : heroStop(); }
  if (sec !== curSec) {
    curSec = sec;
    if (sec) {
      $('#isTx').textContent = sec.dataset.island;
      $('#isIc').setAttribute('href', '#' + sec.dataset.icon);
      views.section.style.setProperty('--c', sec.dataset.c);
      $$('.v-menu a').forEach(a => a.classList.toggle('cur', a.getAttribute('href') === '#' + sec.id));
      if (!heroOn) pulse();
    }
  }
  if (sec) $('#isPr').style.setProperty('--p', (p * 100).toFixed(1) + '%');
  want.section = !heroOn && !!sec;
  render();
}
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); } }, { passive: true });

/* ---------- hero scenes ---------- */
const cap = $('#caption');
const ivWave = makeWave($('#ivW'), 14);
const chips = $$('#chips .chip');
let heroIndex = 0, heroTimer = 0, heroRun = 0;
const heroScenes = [
  { v: 'voice', d: 5600, run: heroVoice },
  { v: 'meeting', d: 7000, run: heroMeeting },
  { v: 'prompter', d: 5600, run: heroPrompter },
  { v: 'focus', d: 5200, run: heroFocus },
  { v: 'home', d: 5400, run: heroHome },
];
function heroGo(i) {
  heroIndex = (i + heroScenes.length) % heroScenes.length;
  const sc = heroScenes[heroIndex], run = ++heroRun;
  chips.forEach((c, j) => { c.classList.toggle('cur', j === heroIndex); c.style.setProperty('--d', sc.d + 'ms'); });
  const f = chips[heroIndex].querySelector('.fill');
  f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
  cap.classList.remove('on');
  want.hero = sc.v; render();
  sc.run(run);
  clearTimeout(heroTimer);
  if (!reduce) heroTimer = setTimeout(() => { if (heroActive && !want.menu) heroGo(heroIndex + 1); else if (heroActive) heroTimer = setTimeout(() => heroGo(heroIndex + 1), 1500); }, sc.d);
}
function heroStop() {
  clearTimeout(heroTimer); heroRun++;
  want.hero = null; cap.classList.remove('on'); setWave(ivWave, false); render();
}
chips.forEach((c, j) => c.addEventListener('click', () => heroGo(j)));

async function heroVoice(run) {
  const words = 'Can we push the design review to Thursday?'.split(' ');
  const s = Math.min(1, (innerWidth - 16) / 440);
  cap.style.top = 60 * s + 22 + 'px';
  cap.innerHTML = '&nbsp;'; cap.classList.add('on');
  setWave(ivWave, true);
  const t0 = performance.now();
  const clockI = setInterval(() => ($('#ivT').textContent = fmt((performance.now() - t0) / 1000)), 250);
  for (let i = 1; i <= words.length && run === heroRun; i++) {
    await sleep(290 + Math.random() * 120);
    if (run !== heroRun) break;
    const fin = Math.max(0, i - 2);
    cap.innerHTML = '“' + esc(words.slice(0, fin).join(' ')) + ' <span class="vol">' + esc(words.slice(fin, i).join(' ')) + '</span>”';
  }
  clearInterval(clockI);
  if (run !== heroRun) return;
  await sleep(380);
  if (run !== heroRun) return;
  setWave(ivWave, false);
  cap.textContent = '“' + words.join(' ') + '”';
  want.hero = 'copied'; render();
}
async function heroMeeting(run) {
  const lns = $$('.v-meeting .ln'), ref = $('#imRef span');
  lns.forEach(l => l.classList.remove('in'));
  ref.textContent = 'Aami report ta Friday er modhye pathiye debo.'; ref.removeAttribute('lang');
  let secs = 42;
  const clockI = setInterval(() => { if (run === heroRun) $('#imT').textContent = fmt(++secs); else clearInterval(clockI); }, 1000);
  for (const [i, at] of [[0, 500], [1, 900], [2, 2400]]) {
    await sleep(at); if (run !== heroRun) return;
    lns[i].classList.add('in');
  }
  await sleep(300); if (run !== heroRun) return;
  // Apple's live text first, then the Bengali model rewrites the line in Bengali script.
  ref.classList.add('fade'); await sleep(380); if (run !== heroRun) return;
  ref.textContent = 'আমি রিপোর্টটা ফ্রাইডের মধ্যে পাঠিয়ে দেব।'; ref.setAttribute('lang', 'bn');
  ref.classList.remove('fade');
}
function heroPrompter(run) {
  const txt = $('#ipTxt'), lines = [...txt.children];
  let off = -36, last = performance.now();
  const frame = t => {
    if (run !== heroRun) return;
    off += (t - last) / 1000 * 21; last = t;
    if (off > lines.length * 31.9 - 40) off = -36;
    txt.style.transform = `translateY(${-off}px)`;
    const cur = Math.round((off + 42) / 31.9);
    lines.forEach((l, i) => l.classList.toggle('cur', i === cur));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function heroFocus(run) {
  let left = 31 * 60 + 51, p = .64;
  const ring = $('#ifRing'), t = $('#ifT');
  const step = () => {
    if (run !== heroRun) return;
    t.textContent = fmt(left--); p += .004;
    ring.style.strokeDashoffset = 282.7 * (1 - p);
    setTimeout(step, 1000);
  };
  step();
}
function heroHome(run) {
  let w = 38;
  const prog = $('#ihProg');
  const step = () => { if (run !== heroRun) return; w = Math.min(100, w + .6); prog.style.width = w + '%'; setTimeout(step, 250); };
  step();
}

/* ---------- voice typing demo ---------- */
const samples = [
  { to: 'Maya Chen', sub: 'Design review', text: 'Hi Maya, can we push the design review to Thursday? I’d like the team to see the new onboarding flow first.' },
  { to: 'Rohan', sub: 'Aaj ki call', text: 'Yaar, main thoda late ho jaoonga. Sabko bata dena ki call paanch baje start hogi.' },
  { to: 'Ankita', sub: 'আজকের প্ল্যান', text: 'আজকে আমি অফিসে একটু দেরি করে পৌঁছাব, তুমি প্লিজ ক্লায়েন্টকে একটা মেইল করে দিও।' },
  { to: 'Release team', sub: 'Before we ship', text: 'আমার মনে হয় ফিচারটা খুব কাজের হবে, but we need to test it properly before the release.' },
];
const key = $('#key'), live = $('#live'), mBody = $('#mBody');
const paste = document.createElement('div');
paste.className = 'paste'; paste.innerHTML = '<kbd>⌘V</kbd> Paste';
$('.mail').appendChild(paste);
let vWords = [], heard = 0, holding = false, vTimer = 0, vClock = 0, voiceSeen = false, voiceVisible = false, autoRun = 0;

function pickSample(i) {
  $$('#samples button').forEach((b, j) => b.classList.toggle('cur', j === i));
  $('#mTo').textContent = samples[i].to;
  $('#mSub').textContent = samples[i].sub;
  mBody.innerHTML = '<span style="color:#b0b0b6">Your words land here when you paste.</span>';
  live.innerHTML = ''; heard = 0;
  vWords = samples[i].text.split(' ');
}
function renderLive() {
  const fin = Math.max(0, heard - 2);
  live.innerHTML = esc(vWords.slice(0, fin).join(' ')) + (heard > fin ? ' <span class="vol">' + esc(vWords.slice(fin, heard).join(' ')) + '</span>' : '');
}
function startTalk() {
  if (holding) return;
  holding = true; heard = 0; live.innerHTML = '';
  key.classList.add('down');
  const t0 = performance.now();
  $('#ivT').textContent = '0:00';
  want.demo = 'voice'; render(); setWave(ivWave, true);
  vClock = setInterval(() => ($('#ivT').textContent = fmt((performance.now() - t0) / 1000)), 250);
  const step = () => {
    if (!holding) return;
    if (heard < vWords.length) { heard++; renderLive(); }
    vTimer = setTimeout(step, 250 + Math.random() * 150);
  };
  vTimer = setTimeout(step, 360);
}
async function stopTalk() {
  if (!holding) return;
  holding = false;
  key.classList.remove('down'); clearTimeout(vTimer); clearInterval(vClock); setWave(ivWave, false);
  if (heard === 0) { want.demo = null; render(); live.textContent = 'Hold a little longer, and talk.'; return; }
  const said = vWords.slice(0, heard).join(' ');
  live.textContent = said;
  want.demo = 'copied'; render();
  await sleep(650); paste.classList.add('on');
  await sleep(600);
  mBody.textContent = said;
  mBody.classList.remove('flash'); void mBody.offsetWidth; mBody.classList.add('flash');
  await sleep(450); paste.classList.remove('on');
  await sleep(700);
  if (want.demo === 'copied') { want.demo = null; render(); }
}
async function autoTalk() {
  const run = ++autoRun;
  await sleep(500);
  if (run !== autoRun || holding || !voiceVisible) return;
  startTalk();
  while (holding && heard < vWords.length && run === autoRun) await sleep(120);
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
onView($('.voice-grid'), () => {
  voiceVisible = true;
  if (!voiceSeen) { voiceSeen = true; autoTalk(); }
}, () => { voiceVisible = false; autoRun++; if (holding) stopTalk(); }, .45);

/* AI clean-up */
const raw = $('#raw'), cleanSw = $('#cleanSw');
let cleanTouched = false, cleanLoop = 0;
const setClean = on => { cleanSw.setAttribute('aria-checked', on); raw.classList.toggle('clean', on); };
cleanSw.addEventListener('click', () => { cleanTouched = true; clearInterval(cleanLoop); setClean(cleanSw.getAttribute('aria-checked') !== 'true'); });
onView(raw, () => {
  if (cleanTouched || cleanLoop) return;
  setTimeout(() => !cleanTouched && setClean(true), 900);
  cleanLoop = setInterval(() => !cleanTouched && setClean(!raw.classList.contains('clean')), 3600);
}, () => { if (!cleanTouched) { clearInterval(cleanLoop); cleanLoop = 0; } }, .6);

/* ---------- languages ---------- */
const sentences = [
  [['bn', 'আমার মনে হয় ফিচারটা খুব কাজের হবে,'], ['en', 'but we need to test it properly before the release.']],
  [['hi', 'Kal ki meeting cancel karo,'], ['en', 'we’ll do it on Monday.']],
  [['en', 'Can you send me the slides?'], ['bn', 'আমি আজ রাতে দেখে নেব।']],
  [['hi', 'Yaar, main thoda late ho jaoonga.'], ['en', 'Start the call without me.']],
];
const tagText = { hi: 'Hindi · English letters', bn: 'Bengali · Bengali script', en: 'English' };
const sent = $('#sent'), sdots = $('#sdots');
sent.style.transition = 'opacity .4s';
sdots.innerHTML = sentences.map((_, i) => `<button aria-label="Example ${i + 1}"></button>`).join('');
let sentI = 0, riverRun = 0;
$$('button', sdots).forEach((b, i) => b.addEventListener('click', () => { sentI = i; river(++riverRun); }));
async function river(run) {
  while (run === riverRun) {
    const S = sentences[sentI];
    $$('button', sdots).forEach((b, i) => b.classList.toggle('cur', i === sentI));
    sent.innerHTML = S.map(([l, t]) => `<span class="run ${l}" lang="${l === 'en' ? 'en' : l}"><span class="tag ${l}">${tagText[l]}</span>` +
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

/* typed cards */
$$('.typed').forEach(p => {
  p.innerHTML = graphemes(p.dataset.text).map(g => `<span class="c">${esc(g)}</span>`).join('');
  let done = false;
  onView(p, async () => {
    if (done) return; done = true;
    for (const c of $$('.c', p)) { c.classList.add('on'); if (!reduce) await sleep(16); }
  }, null, .6);
});

/* ---------- meetings ---------- */
const mini = $('#mini'), callScreen = $('#callScreen'), cursor = $('#cursor'), linesEl = $('#lines'), panel = $('#panel');
const mLines = [
  { who: 'them', text: 'So the beta goes out on Friday, right?' },
  { who: 'me', text: 'Haan, bas final testing baaki hai.' },
  { who: 'them', live: 'Aami report ta Friday er modhye pathiye debo.', text: 'আমি রিপোর্টটা ফ্রাইডের মধ্যে পাঠিয়ে দেব।' },
  { who: 'me', text: 'Perfect. Let’s lock the date today.' },
  { who: 'them', text: 'And I’ll update the release notes tonight.' },
];
let meetRun = 0, meetClock = 0;
function syncPanel() {
  const two = innerWidth > 980;
  panel.style.height = two ? callScreen.offsetHeight + 'px' : '460px';
}
function miniState(s) {
  mini.querySelector('.offer').classList.toggle('on', s === 'offer');
  mini.querySelector('.rec').classList.toggle('on', s === 'rec');
  const [w, h] = s === 'offer' ? [Math.min(250, callScreen.clientWidth - 24), 78] : s === 'rec' ? [176, 26] : [120, 22];
  mini.style.width = w + 'px'; mini.style.height = h + 'px';
}
const moveCursor = (x, y) => { cursor.style.left = x + 'px'; cursor.style.top = y + 'px'; };
async function typeInto(el, text, ms, ok) {
  el.textContent = '';
  for (const g of graphemes(text)) { if (!ok()) return; el.textContent += g; await sleep(ms); }
}
async function meeting(run) {
  const ok = () => run === meetRun;
  clearInterval(meetClock);
  panel.classList.remove('sum');
  linesEl.innerHTML = '';
  $('#pClock').textContent = '0:00'; $('#miniClock').textContent = '0:00';
  $('#askQ').textContent = ''; $('#askA').textContent = '';
  $$('#summary li, #summary .todo').forEach(e => e.classList.remove('in'));
  $('#pHead').innerHTML = '<span style="color:var(--ink3)">Waiting for a call…</span>';
  miniState('idle');
  moveCursor(callScreen.clientWidth * .72, callScreen.clientHeight * .8);
  await sleep(900); if (!ok()) return;
  miniState('offer');
  await sleep(750); if (!ok()) return;
  const r = $('#offerYes').getBoundingClientRect(), sr = callScreen.getBoundingClientRect();
  moveCursor(r.left - sr.left + r.width * .45, r.top - sr.top + r.height * .45);
  await sleep(1050); if (!ok()) return;
  cursor.classList.add('click'); await sleep(170); cursor.classList.remove('click');
  miniState('rec');
  moveCursor(callScreen.clientWidth * .86, callScreen.clientHeight * 1.08);
  $('#pHead').innerHTML = '<span class="dot"></span>Transcribing · Zoom';
  const t0 = performance.now();
  setActivity('meet', '<span class="dot"></span>Transcribing', '0:00');
  meetClock = setInterval(() => {
    const t = fmt((performance.now() - t0) / 1000);
    $('#pClock').textContent = t; $('#miniClock').textContent = t; activityRight('meet', t);
  }, 500);
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
      txt.innerHTML = esc(words.slice(0, fin).join(' ')) + ' <span class="vol">' + esc(words.slice(fin, i).join(' ')) + '</span>';
    }
    txt.textContent = words.join(' ');
    tile.classList.remove('talk');
    if (L.live) {
      await sleep(900); if (!ok()) return;
      txt.innerHTML = `<span class="swap"><span class="a">${esc(L.live)}</span><span class="b" lang="bn">${esc(L.text)}</span></span><span class="ref">Bengali model</span>`;
      txt.classList.add('shimmer');
      await sleep(60); el.classList.add('refined');
    }
    while (linesEl.scrollHeight > linesEl.clientHeight + 2 && linesEl.children.length > 1) linesEl.firstElementChild.remove();
    await sleep(520);
  }
  await sleep(1000); if (!ok()) return;
  clearInterval(meetClock); miniState('idle'); clearActivity('meet');
  $('#pHead').innerHTML = `${icon('i-check', 13, 'var(--green)')}<span style="color:var(--green)">Saved · Summary</span>`;
  panel.classList.add('sum');
  for (const e of $$('#summary li, #summary .todo')) { await sleep(420); if (!ok()) return; e.classList.add('in'); }
  await sleep(500);
  await typeInto($('#askQ'), 'When does the beta go out?', 30, ok);
  await sleep(500);
  await typeInto($('#askA'), 'Friday, once final testing is done. Ankita sends the report the same day.', 16, ok);
  await sleep(5200);
  if (ok()) meeting(++meetRun);
}
function meetStop() {
  meetRun++; clearInterval(meetClock); clearActivity('meet');
  $$('.tile').forEach(t => t.classList.remove('talk'));
}
let meetVisible = false;
onView(callScreen, () => { if (!meetVisible) { meetVisible = true; syncPanel(); meeting(++meetRun); } }, () => { meetVisible = false; meetStop(); }, .35);
$('#replay').addEventListener('click', () => meeting(++meetRun));
syncPanel();

/* ---------- teleprompter ---------- */
const script = 'Hi everyone, and thanks for joining. Today I want to show you how Lintel turns the notch into the most useful spot on your Mac. Watch the words right under the camera: you keep eye contact, and nobody on the call can see your notes. Set your own pace, or let it follow your voice. Hover to pause at any time, and pick up right where you left off. That’s it. Let’s get started.';
const ptxt = $('#ptxt'), pBox = $('#prompterBox'), speed = $('#speed'), followSw = $('#follow');
ptxt.innerHTML = script.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ');
const pWords = $$('.w', ptxt);
const READ = 58;
let pOff = -READ, pLast = 0, pHover = false, pFollow = false, pWord = 0, pNext = 0, pOn = false;
pBox.classList.add('fixed');
function pFrame(t) {
  if (!pOn) return;
  const dt = Math.min(.05, (t - (pLast || t)) / 1000); pLast = t;
  const lh = parseFloat(getComputedStyle(ptxt).lineHeight) || 39;
  if (!pHover && !(reduce && !pFollow)) {
    if (pFollow) {
      if (t >= pNext) {
        if (pWord < pWords.length) {
          const w = pWords[pWord++]; w.classList.add('said');
          pNext = t + 210 + Math.random() * 170 + (/[.,:!?]$/.test(w.textContent) ? 420 : 0);
        } else if (t > pNext + 1200) { pWord = 0; pOff = -READ; pWords.forEach(w => w.classList.remove('said')); }
      }
      const cur = pWords[Math.max(0, pWord - 1)];
      pOff += (cur.offsetTop - READ + 4 - pOff) * Math.min(1, dt * 3.5);
    } else {
      const perLine = pWords.length / Math.max(1, ptxt.offsetHeight / lh);
      pOff += (+speed.value / 60) / perLine * lh * dt;
      if (pOff > ptxt.offsetHeight - READ + 20) pOff = -READ;
    }
  }
  ptxt.style.transform = `translateY(${-pOff}px)`;
  requestAnimationFrame(pFrame);
}
const pLabel = () => (pFollow ? 'Following you' : speed.value + ' wpm');
speed.addEventListener('input', () => { $('#wpm').textContent = speed.value + ' words a minute'; activityRight('prompt', pLabel()); });
followSw.addEventListener('click', () => {
  pFollow = followSw.getAttribute('aria-checked') !== 'true';
  followSw.setAttribute('aria-checked', pFollow);
  pBox.classList.toggle('fixed', !pFollow);
  $('#bezel').classList.toggle('live', pFollow);
  speed.disabled = pFollow;
  pWords.forEach(w => w.classList.remove('said'));
  pWord = Math.max(0, pWords.findIndex(w => w.offsetTop - READ >= pOff - 4));
  pWords.slice(0, pWord).forEach(w => w.classList.add('said'));
  activityRight('prompt', pLabel());
});
pBox.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') pHover = true; });
pBox.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') pHover = false; });
pBox.addEventListener('click', e => { if (e.pointerType !== 'mouse') pHover = !pHover; });
onView($('#bezel'), () => {
  if (pOn) return;
  pOn = true; pLast = 0; requestAnimationFrame(pFrame);
  setActivity('prompt', icon('i-lines', 15, 'var(--amber)') + 'Prompter', pLabel());
}, () => { pOn = false; clearActivity('prompt'); }, .4);

/* ---------- focus ---------- */
const treeSVG = (stage, h = 64) => stage === 0
  ? `<svg class="tr" data-stage="0" viewBox="0 0 64 64" style="width:${h * .53}px"><ellipse cx="32" cy="58" rx="13" ry="3" fill="#4a3426"/><rect x="27" y="49" width="10" height="9" rx="2" fill="#7a5238"/></svg>`
  : `<svg class="tr" data-stage="${stage}" viewBox="0 0 64 64" style="width:${h * .53}px"><ellipse cx="32" cy="58" rx="15" ry="3.5" fill="#4a3426"/><rect class="trunk" x="30" y="30" width="4" height="28" rx="2" fill="#9a6a48"/><circle class="leaf l1" cx="32" cy="30" r="8" fill="#2fb350"/><circle class="leaf l2" cx="24" cy="25" r="9" fill="#34c759"/><circle class="leaf l3" cx="40" cy="23" r="10" fill="#3fd46a"/><circle class="leaf l4" cx="32" cy="15" r="11" fill="#4ade80"/></svg>`;
const days = [['T', 3], ['F', 4], ['S', 0], ['S', 2], ['M', 4], ['T', 3], ['W', 1]];
const garden = $('#garden');
garden.innerHTML = days.map(([d, s], i) => `<div class="d"${i === 6 ? ' style="color:#fff"' : ''}>${treeSVG(s, s ? 50 + s * 8 : 50)}<span>${d}</span></div>`).join('');
$$('svg', garden).forEach((s, i) => (s.style.transitionDelay = i * 90 + 'ms'));
onView(garden, () => garden.classList.add('in'), null, .5);

const gArc = $('#gArc'), gTree = $('#gTree'), gTime = $('#gTime'), gState = $('#gState'), gStart = $('#gStart');
const block = $('#block'), fake = $('#fake');
const fakes = {
  docs: '<i style="width:42%;height:20px"></i><i></i><i style="width:92%"></i><i style="width:86%"></i><i style="width:58%"></i><div style="height:8px"></div><i style="width:95%"></i><i style="width:88%"></i><i style="width:72%"></i>',
  videos: '<div class="vid"></div><i style="width:70%"></i><i style="width:44%"></i>',
  feed: '<div class="post"></div><div class="post"></div><div class="post"></div>',
};
let gMin = 25, gRunning = false, gLeft = 25 * 60, gTotal = 25 * 60, gInt = 0, passUntil = 0, tab = 'docs', focusVisible = false;
function setTab(t) {
  tab = t;
  $$('#btabs button').forEach(b => b.classList.toggle('cur', b.dataset.t === t));
  fake.innerHTML = fakes[t];
  updateBlock();
}
function updateBlock() {
  block.classList.toggle('on', gRunning && tab !== 'docs' && Date.now() > passUntil);
  $('#bTitle').textContent = tab === 'videos' ? 'Videos can wait' : 'Your feed can wait';
}
function gRender() {
  gTime.textContent = fmt(gLeft);
  const frac = gTotal ? gLeft / gTotal : 1;
  gArc.style.strokeDashoffset = gRunning ? 282.7 * frac : 282.7;
  gTree.dataset.stage = gRunning ? Math.min(4, 1 + Math.floor((1 - frac) * 3.4)) : gTree.dataset.stage;
  $('#bLeft').textContent = fmt(gLeft) + ' left';
  $('#bBar').style.width = (1 - frac) * 100 + '%';
  if (gRunning && focusVisible) setActivity('focus', icon('i-leaf', 15, 'var(--green)') + 'Deep work', fmt(gLeft));
  updateBlock();
}
function gStop(done) {
  gRunning = false; clearInterval(gInt); clearActivity('focus');
  gStart.textContent = 'Start';
  if (done) {
    gState.textContent = 'A NEW TREE IN YOUR GARDEN'; gTree.dataset.stage = 4;
    gArc.style.strokeDashoffset = 0;
    const today = garden.lastElementChild;
    today.innerHTML = treeSVG(4, 82) + '<span>W</span>';
    requestAnimationFrame(() => (today.querySelector('svg').style.transform = 'scale(1)'));
    $('#gStreak').textContent = '8 days';
    setTimeout(() => { if (!gRunning) { gState.textContent = 'READY TO FOCUS'; gTree.dataset.stage = 0; gLeft = gMin * 60; gTotal = gLeft; gRender(); } }, 3500);
  } else {
    gState.textContent = 'READY TO FOCUS'; gTree.dataset.stage = 0; gLeft = gMin * 60; gTotal = gLeft;
    gRender();
  }
  $('#fHint').textContent = 'Start a session, then try opening Videos or Feed. The demo runs a minute every second.';
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
onView($('.browser'), () => { focusVisible = true; if (gRunning) gRender(); }, () => { focusVisible = false; clearActivity('focus'); }, .3);
setTab('docs'); gRender();

/* ---------- everything: live widgets ---------- */
// Music
const tracks = [
  { t: 'Golden Hour', a: 'Lumen Drift', c1: '#ff7a59', c2: '#a63fd1', len: 213 },
  { t: 'Night Swim', a: 'Halcyon Park', c1: '#3fb5ff', c2: '#5b3df5', len: 184 },
  { t: 'Paper Planes', a: 'The Quiet Hours', c1: '#ffd166', c2: '#ef476f', len: 221 },
];
const music = $('#music');
let ti = 0, pos = 87, playing = true;
function setTrack(i, keep) {
  ti = (i + tracks.length) % tracks.length;
  const T = tracks[ti];
  music.style.setProperty('--c1', T.c1); music.style.setProperty('--c2', T.c2);
  $('#mTitle').textContent = T.t; $('#mArtist').textContent = T.a;
  if (!keep) pos = 0;
  mRender();
}
function mRender() {
  const T = tracks[ti];
  $('#mProg').style.width = pos / T.len * 100 + '%';
  $('#mCur').textContent = fmt(pos); $('#mLeft').textContent = '-' + fmt(T.len - pos);
}
function setPlaying(p) {
  playing = p; music.classList.toggle('playing', p);
  $('#mPP use').setAttribute('href', p ? '#i-pause' : '#i-play');
}
$('#mPP').addEventListener('click', () => setPlaying(!playing));
$('#mNext').addEventListener('click', () => setTrack(ti + 1));
$('#mPrev').addEventListener('click', () => (pos > 3 ? (pos = 0, mRender()) : setTrack(ti - 1)));
setInterval(() => { if (!playing) return; pos += .5; if (pos >= tracks[ti].len) setTrack(ti + 1); else mRender(); }, 500);
setTrack(0, true); setPlaying(true);

// Next up
const nStart = Date.now();
setInterval(() => {
  const left = Math.max(0, 14 * 60 - (Date.now() - nStart) / 1000);
  $('#nIn').textContent = left > 0 ? `IN ${Math.floor(left / 60)}M ${String(Math.floor(left % 60)).padStart(2, '0')}S` : 'NOW';
}, 1000);

// Clipboard
const clipPool = [
  ['URL', 'lintel.saswatasg.com'], ['Aa', 'Shipping the fix tonight'], ['IMG', 'Screenshot at 9.41 AM'],
  ['PDF', 'Q4 roadmap.pdf'], ['Aa', 'আজকের মিটিং ৫টায়'], ['>_', 'git push origin main'],
  ['Aa', 'Kal subah 10 baje milte hain'], ['#', '#8B7BFF'],
];
const clip = $('#clip');
let clipI = 0, clipVisible = false;
const clipItem = ([k, t]) => `<div class="it"><span class="k">${esc(k)}</span>${esc(t)}</div>`;
clip.innerHTML = clipPool.slice(0, 5).map(clipItem).join(''); clipI = 5;
setInterval(() => {
  if (!clipVisible) return;
  clip.insertAdjacentHTML('afterbegin', clipItem(clipPool[clipI++ % clipPool.length]));
  if (clip.children.length > 6) clip.lastElementChild.remove();
}, 2600);
onView(clip, () => (clipVisible = true), () => (clipVisible = false), .2);

// Todos
$$('#todos button').forEach(b => b.addEventListener('click', () => b.classList.toggle('done')));
setTimeout(() => $('#todos button').classList.add('done'), 2500);

// Timer
let tLeft = 300, tRun = true;
const tArc = $('#tArc');
$('#tRing').addEventListener('click', () => { tRun = !tRun; $('#tState').textContent = tRun ? 'Running' : 'Paused'; });
setInterval(() => {
  if (!tRun) return;
  tLeft--;
  if (tLeft < 0) { tLeft = 300; }
  $('#tTime').textContent = tLeft === 0 ? 'Done' : fmt(tLeft);
  tArc.style.strokeDashoffset = 282.7 * (1 - tLeft / 300);
}, 1000);

// AI limits
const limits = [
  { n: 'Claude', p: 62, r: 'resets 3:40 PM', c: '#d97757' },
  { n: 'Codex', p: 81, r: 'resets Friday', c: '#8b7bff' },
  { n: 'OpenCode Go', p: 44, r: 'resets in 2h', c: '#34c759' },
];
const limitsEl = $('#limits');
limitsEl.innerHTML = limits.map(l => `<div class="l"><div class="t">${l.n}<span>${l.p}% left · ${l.r}</span></div><div class="b"><i style="background:${l.c};width:0"></i></div></div>`).join('');
const limRender = () => $$('.l', limitsEl).forEach((el, i) => {
  el.querySelector('i').style.width = limits[i].p + '%';
  el.querySelector('span').textContent = `${limits[i].p}% left · ${limits[i].r}`;
});
onView(limitsEl, () => limRender(), null, .4);
setInterval(() => { limits.forEach(l => { l.p -= Math.random() < .5 ? 1 : 0; if (l.p < 6) l.p = 96; }); limRender(); }, 2800);

// System monitor
const cpu = Array.from({ length: 40 }, () => 15 + Math.random() * 20), mem = Array.from({ length: 40 }, () => 40 + Math.random() * 5);
const pathOf = (a, max, h = 60) => a.map((v, i) => `${i ? 'L' : 'M'}${(i / (a.length - 1) * 200).toFixed(1)} ${(h - v / max * (h - 6) - 3).toFixed(1)}`).join(' ');
function monTick() {
  cpu.push(Math.max(4, Math.min(96, cpu[cpu.length - 1] + (Math.random() - .5) * 22))); cpu.shift();
  mem.push(Math.max(30, Math.min(60, mem[mem.length - 1] + (Math.random() - .5) * 2))); mem.shift();
  const d = pathOf(cpu, 100);
  $('#cpuP').setAttribute('d', d); $('#cpuA').setAttribute('d', d + ' L200 60 L0 60 Z');
  $('#memP').setAttribute('d', pathOf(mem, 64, 40));
  $('#cpuV').textContent = Math.round(cpu[cpu.length - 1]) + '%';
  $('#memV').textContent = (mem[mem.length - 1] / 4).toFixed(1) + ' GB';
}
monTick(); setInterval(monTick, 700);

// Live activities
const acts = [
  [icon('i-battery', 16, 'var(--green)') + 'Charging', '82%'],
  [icon('i-timer', 15, 'var(--amber)') + 'Timer done', '25:00'],
  [icon('i-video', 15, 'var(--green)') + 'Design review', 'in 1 min'],
  [icon('i-bot', 15, '#d97757') + 'Claude Code', 'finished'],
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
  [...(e.dataTransfer.files || [])].slice(0, 4).forEach(f => shelf.insertAdjacentHTML('beforeend', `<div class="f"><i></i>${esc(f.name)}</div>`));
  while (shelf.children.length > 5) shelf.firstElementChild.remove();
});

// Accent colours
const accents = [['#8b7bff', '#b8abff'], ['#ff6fae', '#ffadd0'], ['#34c759', '#86e6a0'], ['#ffb340', '#ffd28a'], ['#3fb5ff', '#9bd8ff'], ['#ff5b5b', '#ff9e9e']];
const accEl = $('#accents');
accEl.innerHTML = accents.map(([c], i) => `<button class="accent-dot${i ? '' : ' cur'}" style="background:${c}" aria-label="Accent colour ${i + 1}"></button>`).join('');
$$('button', accEl).forEach((b, i) => b.addEventListener('click', () => {
  document.documentElement.style.setProperty('--accent', accents[i][0]);
  document.documentElement.style.setProperty('--accent2', accents[i][1]);
  $$('button', accEl).forEach(x => x.classList.toggle('cur', x === b));
}));

/* ---------- private: things that stay on your Mac ---------- */
const sat = $('#sat');
const satItems = ['Your voice', 'Meetings', 'Clipboard', 'Notes', 'Scripts', 'Focus', 'Todos'];
sat.innerHTML = satItems.map(t => `<span>${t}</span>`).join('');
let satSpin = 0, satOn = false, satLast = 0;
function placeSats() {
  const o = sat.parentElement, R = Math.min(o.clientWidth * .4, o.clientHeight * .4);
  $$('span', sat).forEach((s, i) => {
    const a = i / satItems.length * Math.PI * 2 - Math.PI / 2 + satSpin;
    s.style.setProperty('--x', Math.cos(a) * R + 'px'); s.style.setProperty('--y', Math.sin(a) * R * .82 + 'px');
  });
}
function satFrame(t) {
  if (!satOn) return;
  if (!reduce) satSpin += Math.min(50, t - (satLast || t)) / 1000 * .18;
  satLast = t; placeSats(); requestAnimationFrame(satFrame);
}
placeSats();
onView(sat.parentElement, () => { if (!satOn) { satOn = true; satLast = 0; requestAnimationFrame(satFrame); } }, () => (satOn = false), .2);

/* ---------- gallery ---------- */
const gal = $('#gal');
const galStep = d => gal.scrollBy({ left: d * (gal.querySelector('figure').offsetWidth + 18), behavior: 'smooth' });
$('#gPrev').addEventListener('click', () => galStep(-1));
$('#gNext').addEventListener('click', () => galStep(1));

/* ---------- plans ---------- */
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
if (document.fonts) document.fonts.ready.then(() => setBill(bill, true));

/* ---------- start ---------- */
render();
onScroll();
})();
