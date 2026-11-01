import test from 'node:test';import assert from 'node:assert/strict';
import {makeCorner,cleanAt,progress,act} from '../src/corner-state.js';
test('local spray cleans its hit, not the whole gear',()=>{const s=makeCorner();cleanAt(s,12,.5);assert.equal(s.dirt[12],.5);assert.equal(s.dirt[30],1);assert.equal(s.phase,'wash');});
test('washing gates lift, refit, alignment and start',()=>{const s=makeCorner();act(s);assert.equal(s.phase,'wash');for(let i=0;i<48;i++)cleanAt(s,i,2);assert.equal(s.phase,'lift');assert.ok(progress(s)>=92);for(const next of ['fit','align','start','running']){act(s);assert.equal(s.phase,next);}assert.equal(s.angle,Math.PI/2);});
