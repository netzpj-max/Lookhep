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
  await expect(canvas).toHaveAttribute('data-renderer-version','cinematic-2');
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
    await expect(canvas).toHaveAttribute('data-reflections',String(quality!=='balanced'));
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

test('cinematic cameras, animated orbit, macro restoration and shared pause clock',async({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
  await page.setViewportSize({width:1920,height:1200});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('./');
  await expect(page.locator('#loading')).toHaveCount(0,{timeout:25000});
  const canvas=page.locator('#scene canvas');
  await page.locator('[data-stage="3"]').click();
  for(const view of ['storm','ground','orbit']){
    await page.locator('#camera-view').selectOption(view);
    await expect(canvas).toHaveAttribute('data-camera-view',view);
    await page.waitForTimeout(350);
    await page.screenshot({path:`test-results/cinematic-${view}.png`,fullPage:true});
  }
  await page.locator('#closeup').click();
  await expect(canvas).toHaveAttribute('data-camera-view','closeup');
  await page.locator('#closeup').click();
  await expect(canvas).toHaveAttribute('data-camera-view','orbit');
  await page.locator('#play').click();
  await page.waitForTimeout(1800);
  const running=await canvas.getAttribute('data-weather-time');
  expect(Number(running)).toBeGreaterThan(45);
  await page.locator('#play').click();
  await page.waitForTimeout(400);
  const stopped=await canvas.getAttribute('data-weather-time'),frames=await canvas.getAttribute('data-frames');
  await page.waitForTimeout(500);
  expect(await canvas.getAttribute('data-weather-time')).toBe(stopped);
  expect(await canvas.getAttribute('data-frames')).toBe(frames);
  await page.locator('#reset-camera').click();
  await expect(page.locator('#camera-view')).toHaveValue('overview');
  await expect(canvas).toHaveAttribute('data-camera-view','overview');
  if(process.env.LOOKHEP_HARDWARE==='1'){
    await page.locator('#camera-view').selectOption('storm');
    await page.locator('#fullscreen').click();
    await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement))).toBe(true);
    await page.locator('#play').click();
    await page.waitForTimeout(1200);
    const before=Number(await canvas.getAttribute('data-frames')),started=Date.now();
    await page.waitForTimeout(3500);
    const after=Number(await canvas.getAttribute('data-frames'));
    const fps=Math.round((after-before)*1000/(Date.now()-started));
    console.log('Full-screen Ultra:',JSON.stringify({fps,canvas:await canvas.evaluate(el=>[el.width,el.height]),gpu:await canvas.getAttribute('data-gpu')}));
    expect(fps).toBeGreaterThan(30);
    await page.locator('#play').click();
    await page.screenshot({path:'test-results/cinematic-fullscreen.png'});
    await page.locator('#fullscreen').click();
  }
  expect(errors).toEqual([]);
});
