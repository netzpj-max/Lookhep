import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, boundaries, snapshot, advance } from '../src/model.js';

test('visits all six stages and ends at ground without restarting', () => {
  const edges = boundaries(DEFAULTS);
  assert.deepEqual(edges, [0, 10, 18, 45, 53, 63, 68]);
  for (let i=0;i<6;i++) assert.equal(snapshot(edges[i], DEFAULTS).stage, i);
  const end = snapshot(68, DEFAULTS);
  assert.equal(end.stage, 5);
  assert.equal(end.altitude, 0);
  assert.equal(end.completedCycles, 3);
  assert.equal(advance(67, 3, DEFAULTS, false).ended, true);
  assert.equal(advance(67, 3, DEFAULTS, false).time, 68);
});
test('loops preserve overflow and a stopped clock preserves the state', () => {
  assert.equal(advance(67, 3, DEFAULTS, true).time, 2);
  assert.equal(advance(67, 3, DEFAULTS, true).looped, true);
  assert.deepEqual(snapshot(31, DEFAULTS), snapshot(advance(31, 0, DEFAULTS, true).time, DEFAULTS));
});
test('growth settings change diameter and loop duration', () => {
  const weak = { updraft:50, moisture:40, cycles:1 };
  const strong = { updraft:150, moisture:100, cycles:6 };
  assert.ok(snapshot(boundaries(strong)[6],strong).diameter > snapshot(boundaries(weak)[6],weak).diameter);
  assert.equal(snapshot(boundaries(strong)[6],strong).completedCycles,6);
  assert.ok(boundaries({...DEFAULTS,updraft:150})[6] < boundaries({...DEFAULTS,updraft:50})[6]);
});
test('positions are continuous at phase and cycle boundaries', () => {
  for(const settings of [DEFAULTS,{updraft:50,moisture:40,cycles:6},{updraft:150,moisture:100,cycles:1}]) {
    for(const edge of boundaries(settings).slice(1,-1)) {
      const a=snapshot(edge-1e-5,settings), b=snapshot(edge,settings);
      const distance=Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y,a.position.z-b.position.z);
      assert.ok(distance<0.001,`Position jumped at ${edge}: ${distance}`);
      assert.ok(Math.abs(a.diameter-b.diameter)<0.001);
    }
  }
});
test('every supported preset yields finite bounded readouts', () => {
  for(let cycles=1;cycles<=6;cycles++) for(const updraft of [50,100,150]) for(const moisture of [40,80,100]) {
    const settings={cycles,updraft,moisture},total=boundaries(settings)[6];
    for(let t=0;t<=total;t+=0.3) {
      const s=snapshot(t,settings);
      for(const field of ['altitude','diameter','temperature','phase'])assert.ok(Number.isFinite(s[field]));
      assert.ok(s.altitude>=0&&s.altitude<=15);
      assert.ok(s.completedCycles<=cycles);
      assert.ok(s.stage>=0&&s.stage<6);
    }
  }
});
