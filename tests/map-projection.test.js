import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { normalizeMapProjection, worldOverviewCamera, needsGlobeOverview } from '../src/map-projection.js';

test('Globus ist explizites Opt-in; unbekannte Projektionen bleiben flach', () => {
  for (const value of [null, undefined, '', '3d', 'Globe', 'mercator']) assert.equal(normalizeMapProjection(value), 'mercator');
  assert.equal(normalizeMapProjection('globe'), 'globe');
});

test('Weltübersicht passt in kleine Geräte und respektiert reduzierte Bewegung', () => {
  for (const [width, height] of [[320,568], [390,844], [852,393], [1280,800]]) {
    const camera = worldOverviewCamera({ projection:'globe', width, height, mobile:width<1000, reducedMotion:true });
    assert.ok(camera.zoom >= -.5 && camera.zoom <= 1.9);
    assert.equal(camera.duration, 0);
    assert.equal(camera.pitch, 0);
    assert.equal(camera.essential, false);
  }
  assert.equal(worldOverviewCamera().zoom, 1.7);
});

test('verteilte und datumsgrenzenübergreifende Treffer nutzen eine Globusübersicht', () => {
  const point = (longitude, latitude, coordinatePrecision = 'exact') => ({ longitude, latitude, coordinatePrecision });
  assert.equal(needsGlobeOverview([point(170,5), point(-170,8)]), true);
  assert.equal(needsGlobeOverview([point(3,-65), point(4,70)]), true);
  assert.equal(needsGlobeOverview([point(3,45), point(5,48)]), false);
  assert.equal(needsGlobeOverview([point(170,5,'hidden'), point(-170,8)]), false);
  assert.equal(needsGlobeOverview([]), false);
});

const source = await readFile(new URL('../script.js', import.meta.url), 'utf8');
function projectionHarness({ selected = false, failGlobe = false, ready = true } = {}) {
  const calls = [];
  const app = { projection:'mercator', mapReady:ready, selectedEventId:selected ? 'protected' : null,
    events:[{id:'protected', coordinatePrecision:'region'}], filters:{query:'retained'}, map:{
      resize:()=>{}, stop:()=>calls.push('stop'), setProjection:({type})=>{if (type==='globe'&&failGlobe) throw Error('GPU');calls.push(type);},
      setMinZoom:()=>{}, setRenderWorldCopies:()=>{}
    } };
  const ui = { mapProjectionSelect:{}, worldOverview:{}, globeNote:{} };
  const context = { app, ui, normalizeMapProjection, document:{documentElement:{dataset:{}}},
    syncMapPerspective:()=>{}, applyMapStyle:()=>{}, showWorldOverview:()=>calls.push('overview'),
    syncShareableViewUrl:()=>calls.push('url'), focusMapOnEvent:event=>calls.push(event.id),
    showToast:()=>calls.push('toast'), i18n:{t:key=>key}, console:{warn:()=>{}} };
  const declaration = source.match(/^function setMapProjection\([^]*?^\}/m)?.[0];
  assert.ok(declaration);
  return { app, ui, calls, change:runInNewContext(`(${declaration})`,context) };
}

test('Projektionswechsel bewahrt Auswahl und Filter und erlaubt Rückkehr zur Karte', () => {
  const h = projectionHarness({selected:true});
  assert.equal(h.change('globe'),true);
  assert.equal(h.app.projection,'globe');
  assert.equal(h.ui.globeNote.hidden,false);
  assert.ok(h.calls.includes('protected'));
  assert.equal(h.calls.includes('overview'),false);
  assert.equal(h.app.filters.query,'retained');
  h.change('mercator');
  assert.equal(h.ui.globeNote.hidden,true);
  assert.equal(h.app.selectedEventId,'protected');
});

test('fehlgeschlagener Globus weicht sichtbar auf Mercator aus; Offlinekarten bleiben gesperrt', () => {
  const h = projectionHarness({failGlobe:true});
  assert.equal(h.change('globe'),false);
  assert.equal(h.app.projection,'mercator');
  assert.ok(h.calls.includes('toast'));
  assert.ok(h.calls.includes('overview'));
  const offline = projectionHarness({ready:false});
  assert.equal(offline.change('globe'),false);
  assert.deepEqual(offline.calls,[]);
});
