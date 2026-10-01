export const STAGES = [
  { title: 'เม็ดน้ำถูกยกตัว', short: 'ยกตัว', en: 'UPDRAFT', icon: 'wind', description: 'กระแสอากาศอุ่นชื้นยกตัวอย่างรุนแรงในเมฆคิวมูโลนิมบัส พาเม็ดน้ำจากส่วนล่างของเมฆขึ้นสู่ระดับที่อุณหภูมิต่ำกว่า 0°C', detail: 'ไอน้ำควบแน่นเป็นหยดน้ำ กระแสลมยกตัว (updraft) 50–150 กม./ชม. ตามภาพ สามารถพาหยดน้ำและอนุภาคน้ำแข็งขึ้นไปได้ ยิ่งกระแสลมแรง อนุภาคก็ยิ่งมีโอกาสอยู่ในเมฆนานขึ้น', observation: 'สังเกตเม็ดน้ำสีฟ้าที่เคลื่อนขึ้นตามกระแสลม', range: '0–5 กิโลเมตร', temp: 'ประมาณ 10 ถึง 0°C' },
  { title: 'เริ่มเกิดแกนน้ำแข็ง', short: 'แกนน้ำแข็ง', en: 'ICE EMBRYO', icon: 'snowflake', description: 'หยดน้ำเย็นยิ่งยวดแข็งตัวบนอนุภาคเล็ก ๆ หรือเกาะเม็ดน้ำแข็งที่มีอยู่เดิม เกิดเป็นแกนเริ่มต้นของลูกเห็บ', detail: 'น้ำบางส่วนยังคงเป็นของเหลวได้แม้อุณหภูมิต่ำกว่า 0°C เรียกว่า “น้ำเย็นยิ่งยวด” เมื่อชนอนุภาคน้ำแข็งจะเกาะและแข็งตัว การเกิดลูกเห็บจึงต้องมีทั้งแกนน้ำแข็งและน้ำเหลวในเมฆ', observation: 'เม็ดน้ำเปลี่ยนเป็นแกนน้ำแข็งสีขาว', range: '5–10 กิโลเมตร', temp: 'ประมาณ −10 ถึง −40°C' },
  { title: 'หมุนเวียนในเมฆ', short: 'หมุนเวียน', en: 'GROWTH CYCLES', icon: 'repeat-2', description: 'ลูกเห็บเคลื่อนผ่านบริเวณน้ำเย็นยิ่งยวดภายในเมฆ กระแสลมพยุงและพากลับขึ้นไปได้ ทำให้สะสมน้ำแข็งเพิ่ม', detail: 'เส้นทางวนขึ้นลงในฉากเป็นการอธิบายตามภาพต้นฉบับ ลูกเห็บจริงอาจเติบโตระหว่างถูกพยุงหรือเคลื่อนในแนวราบผ่านกระแสลม โดยไม่จำเป็นต้องขึ้นลงหลายรอบทุกก้อน ชั้นน้ำแข็งหนึ่งชั้นไม่ได้หมายถึงหนึ่งรอบเสมอไป', observation: 'ตามเส้นทางสีฟ้าและนับรอบการหมุนเวียน', range: '5–10 กิโลเมตร', temp: 'บริเวณน้ำเย็นยิ่งยวด < 0°C' },
  { title: 'เติบโตเป็นชั้น ๆ', short: 'สะสมชั้น', en: 'LAYERED GROWTH', icon: 'layers', description: 'หยดน้ำชนและแข็งตัวบนลูกเห็บ เกิดชั้นน้ำแข็งใสและขุ่นสลับกัน ตามสภาวะการเติบโตที่ลูกเห็บพบ', detail: 'การเติบโตแบบแห้ง: หยดน้ำแข็งเร็ว กักฟองอากาศไว้ จึงดูขุ่น การเติบโตแบบเปียก: แข็งช้ากว่า อากาศหลุดออกได้ จึงดูใส ใช้ปุ่ม “ผ่าดูชั้นน้ำแข็ง” เพื่อสำรวจโครงสร้างด้านใน', observation: 'ผ่าดูแกนน้ำแข็งและชั้นใส–ขุ่นที่เพิ่มขึ้น', range: 'ภายในเมฆพายุ', temp: 'ขึ้นกับน้ำเหลวและอุณหภูมิ' },
  { title: 'ลมพยุงไม่ไหว', short: 'ตกจากเมฆ', en: 'FALLING', icon: 'arrow-down', description: 'เมื่อความเร็วตกของลูกเห็บมากกว่าความเร็วลมยกตัว หรือเคลื่อนออกจากบริเวณลมยกตัว ลูกเห็บเริ่มตกลงสู่พื้น', detail: 'แรงโน้มถ่วงทำให้ลูกเห็บตก ขณะที่แรงต้านอากาศและลมยกตัวช่วยพยุง เมื่อลูกเห็บโตขึ้นหรือกระแสลมอ่อนลง สมดุลนี้เปลี่ยนไป กระแสลมจมตัว (downdraft) อาจช่วยพาฝนและลูกเห็บลงมา', observation: 'เส้นทางเปลี่ยนเป็นสีส้มและลูกเห็บลดระดับ', range: 'จากเมฆลงสู่พื้น', temp: 'ผ่านอากาศที่อุ่นขึ้น' },
  { title: 'ลูกเห็บตกถึงพื้น', short: 'ถึงพื้นโลก', en: 'GROUND IMPACT', icon: 'circle-dot', description: 'ลูกเห็บที่ละลายไม่หมดระหว่างตกจะถึงพื้นเป็นก้อนน้ำแข็ง มีขนาดตั้งแต่มิลลิเมตรไปจนถึงหลายเซนติเมตร', detail: 'ขนาดที่ถึงพื้นขึ้นอยู่กับระยะเวลาการเติบโต ความแรงลม ปริมาณน้ำเหลว และการละลายระหว่างตก ก้อนเล็กอาจละลายจนกลายเป็นฝน แบบจำลองนี้เน้นเส้นทางลูกเห็บที่ยังคงเป็นน้ำแข็งเมื่อถึงพื้น', observation: 'ดูตำแหน่งตกและขนาดสุดท้ายของก้อนตัวอย่าง', range: '0 กิโลเมตร', temp: 'อุณหภูมิใกล้พื้นดิน' },
];

export const DEFAULTS = { updraft: 100, moisture: 80, cycles: 3 };

export function boundaries(settings = DEFAULTS) {
  const cycleDuration = 9 * 100 / settings.updraft;
  return [0, 10, 18, 18 + settings.cycles * cycleDuration, 26 + settings.cycles * cycleDuration, 36 + settings.cycles * cycleDuration, 41 + settings.cycles * cycleDuration];
}

export function snapshot(time, settings = DEFAULTS) {
  const edges = boundaries(settings);
  const duration = edges[6];
  const t = Math.max(0, Math.min(time, duration));
  const nextEdge = edges.findIndex((edge, i) => i > 0 && t < edge);
  const stage = nextEdge === -1 ? 5 : Math.max(0, nextEdge - 1);
  const phase = Math.min(1, (t - edges[stage]) / (edges[stage + 1] - edges[stage]));
  const cycleDuration = (edges[3] - edges[2]) / settings.cycles;
  const cycleProgress = stage < 2 ? 0 : stage === 2 ? (t - edges[2]) / cycleDuration : settings.cycles;
  const accumulated = stage < 2 ? 0 : stage === 2 ? cycleProgress * 0.84 : stage === 3 ? settings.cycles * (0.84 + phase * 0.16) : settings.cycles;
  const finalDiameter = 2 + settings.cycles * (settings.moisture / 100) * (settings.updraft / 100) * 10;
  let diameter = stage === 0 ? 1 : 2 + (finalDiameter - 2) * accumulated / settings.cycles;
  let altitude;
  let x;
  let z;
  if (stage === 0) { altitude = 1 + phase * 5; x = -1.4 + phase * 0.35; z = 0.5; diameter = 1 + phase; }
  if (stage === 1) { altitude = 6 + phase * 2.6; x = -1.05 + phase * 0.35; z = 0.5; }
  if (stage === 2) {
    const a = (cycleProgress % 1) * Math.PI * 2;
    altitude = 6.9 + 1.7 * Math.cos(a);
    x = -0.1 - 0.6 * Math.cos(a) + 1.3 * Math.sin(a);
    z = 0.5 + 0.6 * Math.sin(a);
  }
  if (stage === 3) { altitude = 8.6 - phase * 1.1; x = -0.7 + phase * 2.9; z = 0.5; }
  if (stage === 4) { altitude = 7.5 * (1 - phase); x = 2.2 + phase * 0.8; z = 0.5; diameter *= 1 - 0.08 * phase; }
  if (stage === 5) { altitude = 0; x = 3; z = 0.5; diameter *= 0.92; }
  const temperature = altitude < 5 ? 10 - altitude * 2 : altitude < 10 ? -10 - (altitude - 5) * 6 : -40 - (altitude - 10) * 2;
  return { time: t, duration, stage, phase, altitude, temperature, diameter, cycleProgress, completedCycles: Math.min(settings.cycles, Math.floor(cycleProgress + 1e-6)), layers: stage < 1 ? 0 : 1 + Math.floor(accumulated * 2), position: { x, y: altitude, z }, finalDiameter: finalDiameter * 0.92 };
}

export function advance(time, delta, settings, loop) {
  const duration = boundaries(settings)[6];
  const next = time + delta;
  if (loop) return { time: next % duration, ended: false, looped: next >= duration };
  return { time: Math.min(next, duration), ended: next >= duration, looped: false };
}
