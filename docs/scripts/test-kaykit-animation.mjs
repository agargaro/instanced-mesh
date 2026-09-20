/** Run with node docs/scripts/test-kaykit-animation.mjs. Uses real bundled clips. */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Quaternion, Vector3 } from 'three';

const docs = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'kaykit-test-'));
try {
  await symlink(resolve(docs, 'node_modules'), join(temp, 'node_modules'));
  await writeFile(join(temp, 'package.json'), '{"type":"module"}');
  for (const name of ['animation', 'controller', 'math', 'config']) {
    const source = await readFile(resolve(docs, `src/examples/curiosita-kaykit/${name}.ts`), 'utf8');
    await writeFile(join(temp, `${name}.js`), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText);
  }
  const { Performance } = await import(pathToFileURL(join(temp, 'animation.js')));
  const { settings } = await import(pathToFileURL(join(temp, 'config.js')));
  const { CrowdDirector } = await import(pathToFileURL(join(temp, 'controller.js')));
  async function rig(file) {
    const bytes = await readFile(resolve(docs, `public/kaykit/${file}.glb`));
    const size = bytes.readUInt32LE(12);
    const json = JSON.parse(bytes.subarray(20, 20 + size).toString());
    // Strip only render assets; preserve original animation buffers and hierarchy.
    for (const node of json.nodes) delete node.mesh;
    delete json.meshes; delete json.images; delete json.textures; delete json.materials;
    const text = Buffer.from(JSON.stringify(json));
    const padding = Buffer.alloc((4 - text.length % 4) % 4, 32);
    const chunk = Buffer.concat([text, padding]);
    const rest = bytes.subarray(20 + size);
    const header = Buffer.alloc(20);
    header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(20 + chunk.length + rest.length, 8);
    header.writeUInt32LE(chunk.length, 12); header.write('JSON', 16);
    const data = Buffer.concat([header, chunk, rest]);
    return new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
  }
  const general = await rig('Mannequin_Medium_Animated');
  const names = { idle: 'Idle_A', idleB: 'Idle_B', run: 'Running_A', jump: 'Jump_Full_Short', wave: 'Waving', cheer: 'Cheering', hit: 'Hit_A', pushUps: 'Push_Ups', sitUps: 'Sit_Ups', useItem: 'Use_Item', spawn: 'Spawn_Ground', walkA: 'Walking_A', walkB: 'Walking_B', walkC: 'Walking_C', sneak: 'Sneaking', punch: 'Melee_Unarmed_Attack_Punch_A' };
  const all = general.animations;
  const clips = Object.entries(names).map(([name, original]) => ({name, clip: all.find(c => c.name === original)}));
  const dur = Object.fromEntries(clips.map(({name, clip}) => [name, clip.duration]));
  assert.equal(all.length, Object.keys(names).length);
  assert(clips.every(({clip}) => clip?.tracks.length > 0));
  const sampler = new Performance(general.scene, clips);
  sampler.sample({ idleTime: 0, wave: 1, waveTime: 0.6 });
  assert(sampler.actions.wave.getEffectiveWeight() > 0.99, 'wave clip must remain available for the close-up');
  const snapshot = () => {
    const result = [];
    general.scene.traverse(o => { if (o.isBone) result.push(...o.position.toArray(), ...o.quaternion.toArray()); });
    return result;
  };
  for (const idleClip of [0, 1]) {
    sampler.sample({idleClip, idleTime: 100.13}); const a = snapshot();
    sampler.sample({idleClip, idleTime: 100.46}); const b = snapshot();
    assert(a.some((v,i) => Math.abs(v-b[i]) > 1e-4), 'baseline must still animate after 100 seconds');
  }
  // Every jump boundary and recovery must retain a normalized pose budget.
  for (let t = 0; t < 2; t += 0.013) {
    const w = t > 0 && t < dur.jump ? Math.min(1,t / 0.1,(dur.jump-t)/0.24) : 0;
    sampler.sample({idleTime: 40+t, jump:w, jumpTime:t});
    const sum = Object.values(sampler.actions).reduce((sum,a) => sum + (a.enabled ? a.getEffectiveWeight() : 0),0);
    assert(Math.abs(sum-1) < 0.002, `pose weights at ${t}: ${sum}`);
    assert(snapshot().every(Number.isFinite));
  }
  for (const activity of ['pushUps', 'sitUps', 'useItem', 'spawn', 'walkA', 'walkB', 'walkC', 'sneak', 'punch']) {
    for (const time of [0.01, 0.3, dur[activity] - 0.01, dur[activity] + 0.01]) {
      sampler.sample({activity, activityWeight: 0.8, activityTime: time});
      assert(snapshot().every(Number.isFinite), activity);
      const sum = Object.values(sampler.actions).reduce((sum, a) => sum + (a.enabled ? a.getEffectiveWeight() : 0), 0);
      assert(Math.abs(sum - 1) < 1e-6, activity + ': normalized blending');
    }
  }
  // The hero gaze must not inherit animated head rotations from a clip.
  sampler.sample({idleTime: 0.1});
  sampler.aim(new Vector3(0, 1.7, 20), 1, new Quaternion(), 1, 1, undefined, false, true);
  assert(Math.abs(sampler.head.quaternion.z) < 0.01, 'steady gaze has no head roll');
  sampler.sample({idleTime:20,jump:NaN,hit:-2});
  assert.equal(sampler.actions.idle.getEffectiveWeight(),1);
  // Sampling a different individual cannot contaminate the next individual's aim.
  const target = new Vector3(2, 1.2, 8);
  sampler.sample({idleTime:1}); const gazeA = new Quaternion(); sampler.aim(target,0.033,gazeA);
  sampler.sample({idleTime:1}); sampler.aim(new Vector3(-8,1,1),0.2,new Quaternion());
  sampler.sample({idleTime:1}); const gazeB = new Quaternion(); sampler.aim(target,0.033,gazeB);
  assert(gazeA.angleTo(gazeB) < 1e-7);

  function crowd() {
    return Array.from({length:256},(_,id)=>({id,position:new Vector3((id%16)*2.4,0,-Math.floor(id/16)*2.4),gaze:new Quaternion(),yawOffset:0,walk:null}));
  }
  const resting = crowd();
  const breathing = new CrowdDirector(dur, resting, 17);
  for (const t of [0, 5, 20, 60, 180]) {
    let x = 0, y = 0;
    for (const robot of resting) {
      const time = breathing.pose(robot, t).idleTime;
      const next = breathing.pose(robot, t + 1 / 60).idleTime;
      assert(next > time && next - time < 0.025, 'breathing clock stays smooth and forward');
      const phase = time / dur[robot.idleClip ? 'idleB' : 'idle'] * Math.PI * 2;
      x += Math.cos(phase); y += Math.sin(phase);
    }
    assert(Math.hypot(x, y) / resting.length < 0.2, 'crowd breathing phases must stay dispersed');
  }
  const beforeReset = resting.map(r => breathing.pose(r, 37).idleTime);
  breathing.reset();
  assert.deepEqual(resting.map(r => breathing.pose(r, 37).idleTime), beforeReset, 'breathing replays deterministically');
  const a = new CrowdDirector(dur,crowd(),17), b = new CrowdDirector(dur,crowd(),17), c = new CrowdDirector(dur,crowd(),18);
  for(let frame=0;frame<=1800;frame++) a.update(frame/30);
  b.update(60); c.update(60);
  for (const key of ['action','actionAt','attention','cooldown','nextDecision']) assert.deepEqual(a[key],b[key],`${key}: render cadence cannot change decisions`);
  assert.notDeepEqual(a.energy,c.energy);
  b.reset(); b.update(60); assert.deepEqual(a.actionAt,b.actionAt,'reset must replay same seed');
  const trio = crowd();
  trio[0].isB = true;
  for (const robot of trio.slice(0, 2)) robot.walk = { from: new Vector3(0,0,-20), to: robot.position.clone(), t0: 0.5, t1: 3.5 };
  const greetings = new CrowdDirector(dur, trio, 17);
  greetings.update(6);
  assert.equal(greetings.action[0], 0);
  assert.equal(greetings.action[1], 0);
  for (const [id, start] of [[0, settings.greetBAt], [1, settings.greetWalkerAt]]) {
    assert.equal(greetings.pose(trio[id], start).wave, 0);
    assert(greetings.pose(trio[id], start + 0.6).wave > 0.99, 'companion returns the greeting');
    assert.equal(greetings.pose(trio[id], start + dur.wave + 0.01).wave, 0);
  }
  assert(settings.greetWalkerAt + dur.wave < settings.celebrateAt);
  assert.equal(settings.greetingEnd, settings.celebrateAt, 'celebration releases the camera');
  greetings.reducedMotion = true;
  assert.equal(greetings.pose(trio[0], settings.greetBAt + 0.6).wave, 0);
  const moving = crowd();
  moving[0].walk = {from: new Vector3(0,0,-20),to: new Vector3(0,0,0),t0:0,t1:4};
  const movingB = crowd(); movingB[0].walk = moving[0].walk;
  const d = new CrowdDirector(dur,moving,17), e = new CrowdDirector(dur,movingB,17);
  for(let frame=0;frame<=300;frame++) {
    moving[0].position.lerpVectors(moving[0].walk.from,moving[0].walk.to,Math.min(1,frame/120));
    d.update(frame/30);
  }
  e.update(10);
  assert.deepEqual(d.actionAt,e.actionAt,'walker events must not depend on render positions');
  const quiet = new CrowdDirector(dur,crowd(),17); quiet.reducedMotion=true;quiet.update(60);
  assert(quiet.action.every(x=>x===0),'reduced motion preserves rest without strong actions');
  let maxActions=0, samples=0, totalActions=0;
  for(let t=60;t<120;t+=0.2) { a.update(t); const count=Array.from(a.action).filter(Boolean).length; maxActions=Math.max(maxActions,count);totalActions+=count;samples++; }
  assert(totalActions > 0, 'crowd must actually use bundled activities');
  assert(totalActions/samples/256 < 0.3,'strong actions must remain sparse');
  console.log(JSON.stringify({passed:true,clips:dur,meanActiveFraction:totalActions/samples/256,maxActive:maxActions},null,2));
} finally { await rm(temp,{recursive:true,force:true}); }
