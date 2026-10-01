import test from 'node:test';
import assert from 'node:assert/strict';
import {QUALITIES,initialQuality} from '../src/render-quality.js';

test('RTX 4080 chooses Ultra; mobile and software rendering stay bounded',()=>{
  assert.equal(initialQuality('ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Laptop GPU Direct3D11)',false),'ultra');
  assert.equal(initialQuality('ANGLE (Google, Vulkan SwiftShader Device)',false),'balanced');
  assert.equal(initialQuality('',true),'balanced');
  assert.equal(initialQuality('Intel Iris Xe Graphics',false),'high');
});
test('quality presets increase actual shader sampling and retain finite budgets',()=>{
  assert.ok(QUALITIES.balanced.steps<QUALITIES.high.steps);
  assert.ok(QUALITIES.high.steps<QUALITIES.ultra.steps);
  for(const profile of Object.values(QUALITIES)){
    assert.ok(profile.steps<=160&&profile.lightSteps<=10);
    assert.ok(profile.particles<=3200&&profile.pixelRatio<=2);
  }
});
