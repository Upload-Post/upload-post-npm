// Every request has a timeout, so a call can not hang for ever: a long one for
// uploads and file transfers (a synchronous upload waits on the server and a
// big video takes minutes to send), a normal one for the rest. Both can be set
// in the constructor.
//
// No network: axios is given an adapter that records the request.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { UploadPost } from '../index.js';

let sent;

beforeEach(() => {
  sent = [];
  axios.defaults.adapter = async (config) => {
    sent.push(config);
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

const last = () => sent[sent.length - 1];

test('default timeouts: 60 s for calls, 10 min for uploads', async () => {
  const client = new UploadPost('k');
  await client.getHistory();
  assert.equal(last().timeout, 60000);
  await client.getAnalytics('acme', { platforms: ['x'] });
  assert.equal(last().timeout, 60000);
  await client.uploadText({ user: 'u', title: 't', platforms: ['x'] });
  assert.equal(last().timeout, 600000);
  await client.upload('https://example.com/v.mp4', { user: 'u', title: 't', platforms: ['tiktok'] });
  assert.equal(last().timeout, 600000);
});

test('both timeouts can be set in the constructor (0 = no timeout)', async () => {
  const client = new UploadPost('k', { timeout: 5000, uploadTimeout: 1200000 });
  await client.getHistory();
  assert.equal(last().timeout, 5000);
  await client.uploadText({ user: 'u', title: 't', platforms: ['x'] });
  assert.equal(last().timeout, 1200000);
  const unlimited = new UploadPost('k', { timeout: 0, uploadTimeout: 0 });
  await unlimited.getHistory();
  assert.equal(last().timeout, 0);
});

test('a request that times out fails with the network code', async () => {
  axios.defaults.adapter = async (config) => {
    const err = new Error(`timeout of ${config.timeout}ms exceeded`);
    err.code = 'ECONNABORTED';
    err.config = config;
    throw err;
  };
  await assert.rejects(new UploadPost('k', { timeout: 10 }).getHistory(), (err) => {
    assert.equal(err.code, 'ECONNABORTED');
    assert.match(err.message, /timeout of 10ms exceeded/);
    return true;
  });
});
