import './style.css';
import { createIcons, Hexagon, GraduationCap, BookOpen, Orbit, Rotate3d, Maximize, MousePointer2, Scan, Ruler, Thermometer, CircleDashed, Repeat2, RotateCcw, SkipBack, Pause, Play, SkipForward, Gauge, Repeat, Wind, Snowflake, Layers, ArrowDown, CircleDot, Eye, ArrowUpRight, SlidersHorizontal, Info, X, ExternalLink } from 'lucide';
import { DEFAULTS, STAGES, boundaries, snapshot, advance } from './model.js';
import { StormScene } from './storm-scene.js';

const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const baseUrl = import.meta.env.BASE_URL;
const icons = { Hexagon, GraduationCap, BookOpen, Orbit, Rotate3d, Maximize, MousePointer2, Scan, Ruler, Thermometer, CircleDashed, Repeat2, RotateCcw, SkipBack, Pause, Play, SkipForward, Gauge, Repeat, Wind, Snowflake, Layers, ArrowDown, CircleDot, Eye, ArrowUpRight, SlidersHorizontal, Info, X, ExternalLink };
const stageButtons = STAGES.map((stage, i) => `<button class="stage-button ${i === 0 ? 'active' : ''}" data-stage="${i}" aria-current="${i === 0 ? 'step' : 'false'}"><span class="stage-number">${String(i + 1).padStart(2, '0')}</span><span class="stage-text"><strong>${stage.title}</strong><small>${stage.en}</small></span><span class="stage-symbol">${icon(stage.icon)}</span></button>`).join('');

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="${baseUrl}" aria-label="Lookhep หน้าหลัก"><span class="brand-mark">${icon('hexagon')}<span></span></span><b>lookhep<span class="brand-dot">.</span></b><span class="brand-tag">ATMOSPHERE LAB</span></a>
    <div class="top-actions"><span class="educational">${icon('graduation-cap')} แบบจำลองเพื่อการเรียนรู้</span><button class="quiet-button" id="about">${icon('book-open')}<span>ข้อมูลและที่มา</span></button></div>
  </header>
  <main>
    <section class="intro"><div><div class="eyebrow"><span></span> EXPLORE THE SCIENCE OF HAIL</div><h1>จากหยดน้ำเล็ก ๆ <span>สู่ลูกเห็บ</span></h1><p>สำรวจการเดินทางภายในเมฆพายุ ผ่านแบบจำลอง 3 มิติที่คุณควบคุมได้</p></div><div class="intro-meta"><span class="meta-icon">${icon('orbit')}</span><div><strong>หนึ่งก้อน หกขั้นตอน</strong><span>ทุกการเปลี่ยนแปลง มีเรื่องราว</span></div></div></section>
    <div class="lab-layout">
      <section class="simulation-panel" aria-label="แบบจำลองลูกเห็บสามมิติ">
        <div class="scene-toolbar"><div class="scene-title"><span class="live-dot"></span><strong>ห้องทดลองเมฆพายุ</strong><span class="tag">3D SIMULATION</span></div><div class="scene-buttons"><button id="reset-camera" class="icon-button" aria-label="รีเซ็ตมุมกล้อง" title="รีเซ็ตมุมกล้อง">${icon('rotate-3d')}</button><button id="fullscreen" class="icon-button" aria-label="เต็มหน้าจอ" title="เต็มหน้าจอ">${icon('maximize')}</button></div></div>
        <div class="render-settings"><div class="scene-mode" role="group" aria-label="มุมมองเมฆ"><button id="mode-realistic" class="active" aria-pressed="true">สมจริง</button><button id="mode-study" aria-pressed="false">ดูในเมฆ</button></div><button id="closeup" class="closeup-button" aria-pressed="false">${icon('scan')} ดูลูกเห็บใกล้ ๆ</button><div class="render-status"><span id="fps">— FPS</span><label>คุณภาพ <select id="quality" aria-label="คุณภาพกราฟิก"><option value="balanced">สมดุล</option><option value="high">สูง</option><option value="ultra">Ultra</option></select></label></div></div>
        <div class="viewport" id="viewport">
          <div id="scene" role="img" aria-label="เมฆพายุสามมิติพร้อมเส้นทางลูกเห็บ สามารถลากหมุนและเลื่อนเพื่อซูมได้"></div>
          <div class="viewport-grain"></div>
          <div class="atmosphere-labels" id="atmosphere-labels"><div><b>15 <small>km</small></b><span>ยอดเมฆ · ต่ำกว่า −40°C</span></div><div><b>10 <small>km</small></b><span>เขตน้ำแข็ง · −40°C</span></div><div><b>5 <small>km</small></b><span>เขตเย็นยิ่งยวด · −10°C</span></div><div><b>0 <small>km</small></b><span>พื้นโลก · 10°C</span></div></div>
          <div class="scene-note"><span class="note-line"></span><div>เมฆคิวมูโลนิมบัส<small>Cumulonimbus</small></div></div>
          <div class="scene-legend"><span><i class="legend-up"></i> ลมยกตัว</span><span><i class="legend-down"></i> ลมจมตัว</span><span><i class="legend-hail"></i> ก้อนที่ติดตาม</span></div>
          <div class="scene-help">${icon('mouse-pointer-2')} ลากเพื่อหมุน <span>·</span> เลื่อนเพื่อซูม</div>
          <button id="cutaway" class="cutaway-button" aria-pressed="false">${icon('scan')} ผ่าดูชั้นน้ำแข็ง</button>
          <div class="loading" id="loading"><span></span> กำลังสร้างบรรยากาศ…</div>
          <div id="label-hail" class="hail-label"><span class="hail-label-dot"></span> <span id="hail-label-text">เม็ดน้ำ</span></div>
        </div>
        <div class="live-readings"><div><span>${icon('ruler')} ความสูง</span><b><span id="altitude">1.0</span><small> km</small></b></div><div><span>${icon('thermometer')} อุณหภูมิ</span><b><span id="temperature">8</span><small> °C</small></b></div><div><span>${icon('circle-dashed')} เส้นผ่านศูนย์กลาง</span><b><span id="diameter">1.0</span><small> mm</small></b></div><div><span>${icon('repeat-2')} รอบการเติบโต</span><b><span id="cycle-count">0</span><small> / <span id="cycle-total">3</span></small></b></div></div>
        <div class="playback">
          <div class="playback-top"><div class="playback-actions"><button class="icon-button" id="restart" aria-label="เริ่มใหม่" title="เริ่มใหม่">${icon('rotate-ccw')}</button><button class="icon-button" id="previous" aria-label="ขั้นตอนก่อนหน้า" title="ขั้นตอนก่อนหน้า">${icon('skip-back')}</button><button class="play-button" id="play" aria-label="หยุดชั่วคราว">${icon('pause')}</button><button class="icon-button" id="next" aria-label="ขั้นตอนถัดไป" title="ขั้นตอนถัดไป">${icon('skip-forward')}</button><div class="time-display"><span id="time">00:00</span><span> / </span><span id="total-time">01:08</span></div></div><div class="playback-options"><label class="speed-control">${icon('gauge')}<select id="speed" aria-label="ความเร็วการจำลอง"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option></select></label><button id="loop" class="loop-button active" aria-pressed="true" title="เล่นวนครบวงจร">${icon('repeat')}<span>วนวงจร</span></button></div></div>
          <div class="timeline-wrap"><input type="range" id="timeline" min="0" max="68" step="0.01" value="0" aria-label="เลือกเวลาของแบบจำลอง"/><div id="timeline-markers"></div></div><div class="timeline-caption"><span id="playing-label">กำลังจำลอง</span><span>เวลาในแบบจำลอง · ไม่ใช่ระยะเวลาจริงของพายุ</span></div>
        </div>
      </section>
      <aside class="process-panel"><div class="panel-heading"><div><span class="eyebrow">THE HAIL JOURNEY</span><h2>วงจรการเกิดลูกเห็บ</h2></div><span class="count-tag">6 ขั้นตอน</span></div><div class="stage-list" role="group" aria-label="เลือกขั้นตอนการเกิดลูกเห็บ">${stageButtons}</div><div class="stage-detail"><div class="detail-heading"><span id="detail-step">ขั้นตอนที่ 01</span><span id="detail-icon">${icon('wind')}</span></div><h3 id="detail-title">${STAGES[0].title}</h3><p id="detail-description">${STAGES[0].description}</p><div class="observation">${icon('eye')}<span id="observation">${STAGES[0].observation}</span></div><button id="more-detail" class="text-button">เจาะลึกขั้นตอนนี้ ${icon('arrow-up-right')}</button></div></aside>
    </div>
    <section class="environment"><div class="environment-title"><span class="settings-symbol">${icon('sliders-horizontal')}</span><div><h2>สร้างสภาวะพายุของคุณ</h2><p>ปรับปัจจัย แล้วดูว่าการเติบโตเปลี่ยนไปอย่างไร</p></div></div><div class="parameter"><label for="updraft">กระแสลมยกตัว <b><span id="updraft-value">100</span> <small>กม./ชม.</small></b></label><input id="updraft" type="range" min="50" max="150" step="5" value="100"/><div class="range-labels"><span>50 · เบา</span><span>150 · แรง</span></div></div><div class="parameter"><label for="moisture">น้ำเหลวในเมฆ <b><span id="moisture-value">80</span><small>%</small></b></label><input id="moisture" type="range" min="40" max="100" step="5" value="80"/><div class="range-labels"><span>น้อย</span><span>มาก</span></div></div><div class="parameter"><label for="cycles">รอบหมุนเวียนตัวอย่าง <b><span id="cycles-value">3</span> <small>รอบ</small></b></label><input id="cycles" type="range" min="1" max="6" step="1" value="3"/><div class="range-labels"><span>1 รอบ</span><span>6 รอบ</span></div></div></section>
    <div class="bottom-info"><div class="view-options"><span>แสดงในฉาก</span><label><input id="show-clouds" type="checkbox" checked/> เมฆ</label><label><input id="show-flow" type="checkbox" checked/> กระแสลม</label><label><input id="show-labels" type="checkbox" checked/> ระดับความสูง</label></div><span>${icon('info')} ค่าตัวอย่างเพื่ออธิบายกระบวนการ ขนาดก้อนในฉากขยายเพื่อให้มองเห็น</span></div>
    <footer><span><b>lookhep.</b> A little curiosity, a whole atmosphere.</span><span class="creator-credit">สร้างสรรค์โดย <a href="https://www.facebook.com/netzj" target="_blank" rel="noopener noreferrer">Net Phonlakit ${icon('arrow-up-right')}</a></span><span>อ้างอิงภาพ มิตรเอิร์ธ · mitrearth และ <a href="https://www.nssl.noaa.gov/education/svrwx101/hail/" target="_blank" rel="noopener noreferrer">NOAA / NSSL ${icon('arrow-up-right')}</a></span></footer>
  </main>
  <dialog id="details-dialog"><div class="dialog-header"><span class="eyebrow">EXPLORE THE DETAILS</span><button class="icon-button close-dialog" aria-label="ปิดรายละเอียด">${icon('x')}</button></div><div id="dialog-content"></div></dialog>
  <dialog id="about-dialog"><div class="dialog-header"><span class="eyebrow">SCIENCE & SOURCES</span><button class="icon-button close-dialog" aria-label="ปิดข้อมูล">${icon('x')}</button></div><h2>เบื้องหลังห้องทดลอง</h2><p class="creator-credit">สร้างสรรค์โดย <a href="https://www.facebook.com/netzj" target="_blank" rel="noopener noreferrer">Net Phonlakit ${icon('arrow-up-right')}</a></p><p>แบบจำลองเชิงอธิบายจากอินโฟกราฟิก “กระบวนการเกิดลูกเห็บ” ของมิตรเอิร์ธ · mitrearth ครอบคลุมการยกตัว การเกิดแกนน้ำแข็ง การหมุนเวียน การเติบโตเป็นชั้น และการตกถึงพื้น</p><div class="about-grid"><div><h3>บรรยากาศตามภาพ</h3><p>0–5 กม. ประมาณ 10 ถึง 0°C<br>5–10 กม. ประมาณ −10 ถึง −40°C<br>ยอดเมฆ 10–15 กม. ต่ำกว่า −40°C<br>ลมยกตัว 50–150 กม./ชม.</p></div><div><h3>ปัจจัยที่เอื้อต่อการเกิด</h3><p>อากาศชื้นและมีน้ำเหลวเพียงพอ<br>ลมยกตัวแรงและต่อเนื่อง<br>บริเวณในเมฆที่เย็นต่ำกว่า 0°C<br>เมฆคิวมูโลนิมบัสที่พัฒนาตัวสูงใหญ่</p></div></div><div class="science-note"><h3>อ่านภาพอย่างเข้าใจ</h3><p>ชั้นขุ่นมักเกิดจากการแข็งตัวเร็วและกักฟองอากาศ (dry growth) ส่วนชั้นใสมักเกิดจากการแข็งตัวช้ากว่าและปล่อยอากาศออกได้ (wet growth) ซึ่งต่างจากคำกำกับในภาพต้นฉบับ การเติบโตไม่จำเป็นต้องวนขึ้นลงหลายครั้งเสมอ และจำนวนชั้นไม่เท่ากับจำนวนรอบ</p></div><p>ภาพกล่าวว่ามักเกิดช่วงฤดูร้อนหรือช่วงเปลี่ยนผ่านที่อากาศร้อนชื้นและมีพายุบ่อย แต่ฤดูกาลและความสูงของระดับเยือกแข็งขึ้นกับสถานที่และสภาพอากาศแต่ละวัน</p><p class="muted">เวลา ขนาด อุณหภูมิ ณ จุดติดตาม และการตอบสนองต่อค่าปรับเป็นค่าประมาณเพื่อสาธิต ไม่ใช่แบบจำลองพยากรณ์อากาศเชิงฟิสิกส์ อุณหภูมิในฉากใช้โปรไฟล์ตัวอย่างที่อิงช่วงในภาพ และก้อนน้ำแข็งถูกขยายเพื่อให้มองเห็น</p><div class="source-links"><a href="${baseUrl}reference.jpg" target="_blank" rel="noopener noreferrer">ดูภาพต้นฉบับ ${icon('external-link')}</a><a href="https://www.nssl.noaa.gov/education/svrwx101/hail/" target="_blank" rel="noopener noreferrer">NOAA / NSSL: Hail Basics ${icon('external-link')}</a><a href="https://www.noaa.gov/jetstream/hail" target="_blank" rel="noopener noreferrer">NOAA: Thunderstorm Hazards ${icon('external-link')}</a></div></dialog>
`;

function refreshIcons() { createIcons({ icons, attrs: { 'stroke-width': 1.7 } }); }
refreshIcons();
const $ = id => document.getElementById(id);
let settings = { ...DEFAULTS };
const state = { time: 0, playing: !matchMedia('(prefers-reduced-motion: reduce)').matches, speed: 1, loop: true, cutaway: false, lastStage: -1, completed: 0 };
let scene;
try {
  scene = new StormScene($('scene'), $('label-hail'));
  $('quality').value = scene.quality;
  $('quality').title = scene.gpuName;
  scene.ready.then(() => $('loading')?.remove()).catch(error => { console.error(error); $('loading').textContent = 'ไม่สามารถสร้างเมฆได้ กรุณาโหลดหน้าใหม่'; });
}
catch (error) { console.error(error); $('loading').innerHTML = 'ไม่สามารถเปิดฉาก 3D ได้ กรุณาใช้เบราว์เซอร์ที่รองรับ WebGL'; }

const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
function updateControls() {
  $('play').innerHTML = icon(state.playing ? 'pause' : 'play');
  $('play').setAttribute('aria-label', state.playing ? 'หยุดชั่วคราว' : 'เล่นแบบจำลอง');
  $('playing-label').textContent = state.playing ? 'กำลังจำลอง' : state.time >= boundaries(settings)[6] ? 'ครบวงจรแล้ว' : 'หยุดชั่วคราว';
  $('playing-label').classList.toggle('paused', !state.playing);
  $('fps').textContent = state.playing ? `${scene?.stats.fps || '—'} FPS` : 'หยุดภาพ';
  refreshIcons();
}
function updateTimeline() {
  const edges = boundaries(settings);
  $('timeline').max = edges[6];
  $('total-time').textContent = formatTime(edges[6]);
  $('timeline-markers').innerHTML = edges.slice(0, 6).map((t, i) => `<button style="left:${t / edges[6] * 100}%" data-marker="${i}" title="${STAGES[i].title}" aria-label="ไปขั้นตอนที่ ${i + 1}"><span>${i + 1}</span></button>`).join('');
  $('timeline-markers').querySelectorAll('button').forEach(button => button.onclick = () => selectStage(Number(button.dataset.marker)));
  $('cycle-total').textContent = settings.cycles;
}
function updateReadings(s) {
  $('altitude').textContent = s.altitude.toFixed(1);
  $('temperature').textContent = Math.round(s.temperature).toString().replace('-', '−');
  $('diameter').textContent = s.diameter.toFixed(1);
  $('cycle-count').textContent = s.completedCycles;
  $('time').textContent = formatTime(state.time);
  $('timeline').value = state.time;
  $('timeline').style.setProperty('--progress', `${s.time / s.duration * 100}%`);
  $('hail-label-text').textContent = s.stage === 0 ? 'เม็ดน้ำ' : s.stage === 1 ? 'แกนน้ำแข็ง' : `ลูกเห็บ · ${s.diameter.toFixed(1)} mm`;
  if (state.lastStage !== s.stage) {
    state.lastStage = s.stage;
    const stage = STAGES[s.stage];
    document.querySelectorAll('[data-stage]').forEach(button => { const active = Number(button.dataset.stage) === s.stage; button.classList.toggle('active', active); button.classList.toggle('done', Number(button.dataset.stage) < s.stage); button.setAttribute('aria-current', active ? 'step' : 'false'); });
    $('detail-step').textContent = `ขั้นตอนที่ ${String(s.stage + 1).padStart(2, '0')}`;
    $('detail-title').textContent = stage.title;
    $('detail-description').textContent = stage.description;
    $('observation').textContent = stage.observation;
    $('detail-icon').innerHTML = icon(stage.icon);
    document.querySelectorAll('[data-marker]').forEach(b => b.classList.toggle('current', Number(b.dataset.marker) === s.stage));
    refreshIcons();
  }
}
function selectStage(index) { state.time = boundaries(settings)[index]; state.playing = false; updateControls(); draw(); }
function draw() { const s = snapshot(state.time, settings); updateReadings(s); scene?.update(s, settings, state.cutaway); }
document.querySelectorAll('[data-stage]').forEach(button => button.onclick = () => selectStage(Number(button.dataset.stage)));
$('play').onclick = () => { if (!state.playing && state.time >= boundaries(settings)[6]) state.time = 0; state.playing = !state.playing; updateControls(); draw(); };
$('restart').onclick = () => { state.time = 0; state.completed = 0; state.playing = false; updateControls(); draw(); };
$('previous').onclick = () => selectStage(Math.max(0, snapshot(state.time, settings).stage - 1));
$('next').onclick = () => selectStage(Math.min(5, snapshot(state.time, settings).stage + 1));
$('speed').onchange = event => { state.speed = Number(event.target.value); };
$('loop').onclick = () => { state.loop = !state.loop; $('loop').classList.toggle('active', state.loop); $('loop').setAttribute('aria-pressed', String(state.loop)); };
$('timeline').oninput = event => { state.time = Number(event.target.value); state.playing = false; updateControls(); draw(); };
$('cutaway').onclick = () => { state.cutaway = !state.cutaway; $('cutaway').classList.toggle('active', state.cutaway); $('cutaway').setAttribute('aria-pressed', String(state.cutaway)); draw(); };
$('reset-camera').onclick = () => { scene?.setCloseup(false); $('viewport').classList.remove('is-closeup'); $('closeup').classList.remove('active'); $('closeup').setAttribute('aria-pressed','false'); };
$('quality').onchange = e => scene?.setQuality(e.target.value);
for (const [id, study] of [['mode-realistic',false],['mode-study',true]]) $(id).onclick = () => { scene?.setStudy(study); $('mode-realistic').classList.toggle('active',!study); $('mode-realistic').setAttribute('aria-pressed',String(!study)); $('mode-study').classList.toggle('active',study); $('mode-study').setAttribute('aria-pressed',String(study)); };
$('closeup').onclick = () => { const enabled = $('closeup').getAttribute('aria-pressed') !== 'true'; scene?.setCloseup(enabled); $('viewport').classList.toggle('is-closeup',enabled); $('closeup').setAttribute('aria-pressed',String(enabled)); $('closeup').classList.toggle('active',enabled); };
$('scene').addEventListener('render-status',e => { $('fps').textContent=e.detail; });
$('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('.simulation-panel').requestFullscreen(); } catch { $('fullscreen').title = 'เบราว์เซอร์นี้ไม่รองรับการแสดงเต็มหน้าจอ'; } };
$('show-clouds').onchange = e => scene?.setClouds(e.target.checked);
$('show-flow').onchange = e => scene?.setFlow(e.target.checked);
$('show-labels').onchange = e => { $('atmosphere-labels').hidden = !e.target.checked; };
for (const name of ['updraft', 'moisture', 'cycles']) $('' + name).oninput = e => { const oldDuration = boundaries(settings)[6]; settings[name] = Number(e.target.value); $(name + '-value').textContent = settings[name]; state.time = state.time / oldDuration * boundaries(settings)[6]; state.lastStage = -1; updateTimeline(); draw(); };
$('more-detail').onclick = () => {
  const s = snapshot(state.time, settings), stage = STAGES[s.stage];
  $('dialog-content').innerHTML = `<div class="dialog-step">${String(s.stage + 1).padStart(2, '0')} <span>${stage.en}</span></div><h2>${stage.title}</h2><p>${stage.description}</p><div class="dialog-readings"><div><small>ระดับความสูงที่เกี่ยวข้อง</small><b>${stage.range}</b></div><div><small>อุณหภูมิที่เกี่ยวข้อง</small><b>${stage.temp}</b></div></div><h3>เกิดอะไรขึ้นในขั้นตอนนี้?</h3><p>${stage.detail}</p>${s.stage === 3 ? '<div class="ice-explainer"><div class="ice-rings"><span></span></div><div><b>แกนกลาง → ชั้นขุ่น → ชั้นใส</b><p>ขุ่น: แข็งเร็ว มีฟองอากาศ<br>ใส: แข็งช้ากว่า ฟองอากาศหลุดออก</p></div></div>' : ''}<div class="observation">${icon('eye')} ${stage.observation}</div><p class="muted">ค่าการเคลื่อนไหวและขนาดในฉากเป็นตัวอย่างเชิงอธิบาย</p>`;
  refreshIcons(); $('details-dialog').showModal();
};
$('about').onclick = () => $('about-dialog').showModal();
document.querySelectorAll('.close-dialog').forEach(button => button.onclick = () => button.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog && (e.clientX < dialog.getBoundingClientRect().left || e.clientX > dialog.getBoundingClientRect().right || e.clientY < dialog.getBoundingClientRect().top || e.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); }));
document.addEventListener('keydown', e => { if (e.code === 'Space' && !['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { e.preventDefault(); $('play').click(); } });
updateTimeline(); updateControls(); draw();
let previous = performance.now(), lastReading = 0, lastStats = 0;
function animate(now) {
  const dt = Math.min((now - previous) / 1000, 0.1); previous = now;
  if (state.playing && !document.hidden) { const next = advance(state.time, dt * state.speed, settings, state.loop); state.time = next.time; if (next.looped) state.completed++; if (next.ended) { state.playing = false; updateControls(); } }
  const s = snapshot(state.time, settings);
  if (now - lastReading > 80) { updateReadings(s); lastReading = now; }
  scene?.update(s, settings, state.cutaway);
  scene?.render();
  if (scene && now - lastStats > 1200) { $('fps').textContent = state.playing ? `${scene.stats.fps || '—'} FPS` : 'หยุดภาพ'; $('fps').title = scene.gpuName; lastStats = now; }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
