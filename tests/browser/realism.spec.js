import {test,expect} from '@playwright/test';

test('volumetric renderer, quality switches, inspection and frozen frames',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error'&&/THREE|shader|WebGL|GLSL/i.test(msg.text()))errors.push(msg.text());});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('./');
  await expect(page.locator('#loading')).toHaveCount(0,{timeout:20000});
  const canvas=page.locator('#scene canvas');
  await expect(canvas).toHaveAttribute('data-cloud-ready','true');
  console.log('Graphics adapter:',await canvas.getAttribute('data-gpu'));
  await page.locator('[data-stage="3"]').click();
  const frames=await canvas.getAttribute('data-frames');
  await page.waitForTimeout(500);
  expect(await canvas.getAttribute('data-frames')).toBe(frames);
  await page.locator('#mode-study').click();
  await expect(page.locator('#mode-study')).toHaveAttribute('aria-pressed','true');
  await page.locator('#mode-realistic').click();
  await expect(page.locator('#mode-realistic')).toHaveAttribute('aria-pressed','true');
  for(const [quality,steps] of [['ultra','144'],['high','88'],['balanced','48']]) {
    await page.locator('#quality').selectOption(quality);
    await expect(canvas).toHaveAttribute('data-quality',quality);
    await expect(canvas).toHaveAttribute('data-cloud-steps',steps);
  }
  await page.locator('#quality').selectOption(process.env.LOOKHEP_HARDWARE==='1'?'ultra':'balanced');
  await page.locator('#play').click();
  await page.waitForTimeout(2500);
  console.log('Measured playback:',await page.locator('#fps').textContent());
  await page.locator('#play').click();
  await page.screenshot({path:'test-results/realistic-cloud.png',fullPage:true});
  await page.locator('#closeup').click();
  await expect(page.locator('#closeup')).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:'test-results/ice-closeup.png',fullPage:true});
  await page.locator('#closeup').click();
  await page.locator('#cutaway').click();
  await expect(page.locator('.cutaway-label')).toBeVisible();
  await page.screenshot({path:'test-results/ice-section.png',fullPage:true});
  await page.reload();
  await expect(page.locator('#quality')).toHaveValue(process.env.LOOKHEP_HARDWARE==='1'?'ultra':'balanced');
  expect(errors).toEqual([]);
});
