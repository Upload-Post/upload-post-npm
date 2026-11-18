// Required arguments are checked before any request: an empty profile or id in
// the path (`/analytics/undefined`) and getAnalytics without platforms are
// answered 400 by the API, so the SDK says so itself and sends nothing.
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

const client = () => new UploadPost('test-key');
const urlPath = () => sent[sent.length - 1].url.replace('https://api.upload-post.com/api', '');

test('getAnalytics without a profile fails before the request', async () => {
  for (const profile of [undefined, null, '', '   ']) {
    await assert.rejects(client().getAnalytics(profile, { platforms: ['instagram'] }), /profileUsername is required/);
  }
  assert.equal(sent.length, 0);
});

test('getAnalytics without platforms fails before the request', async () => {
  await assert.rejects(client().getAnalytics('acme'), /platforms is required/);
  await assert.rejects(client().getAnalytics('acme', { platforms: [] }), /platforms is required/);
  await assert.rejects(client().getAnalytics('acme', { platforms: '' }), /platforms is required/);
  assert.equal(sent.length, 0);
});

test('getAnalytics sends the profile encoded and the platforms', async () => {
  await client().getAnalytics('my brand/eu', { platforms: ['instagram', 'tiktok'] });
  assert.equal(urlPath(), '/analytics/my%20brand%2Feu');
  assert.deepEqual(sent[0].params, { platforms: 'instagram,tiktok' });
  await client().getAnalytics('acme', { platforms: 'instagram,x' });
  assert.deepEqual(sent[1].params, { platforms: 'instagram,x' });
});

test('other methods with an id in the path refuse an empty one', async () => {
  const c = client();
  await assert.rejects(c.getTotalImpressions(undefined), /profileUsername is required/);
  await assert.rejects(c.getPostAnalytics(''), /requestId is required/);
  await assert.rejects(c.cancelScheduled(undefined), /jobId is required/);
  await assert.rejects(c.editScheduled(null, { title: 'x' }), /jobId is required/);
  await assert.rejects(c.getWebhookDelivery(undefined), /deliveryId is required/);
  await assert.rejects(c.redeliverWebhook(''), /deliveryId is required/);
  assert.equal(sent.length, 0);
});

test('scheduled job ids are encoded in the path', async () => {
  await client().cancelScheduled('a/b c');
  assert.equal(urlPath(), '/uploadposts/schedule/a%2Fb%20c');
  await client().editScheduled('job-1', { title: 'x' });
  assert.equal(urlPath(), '/uploadposts/schedule/job-1');
});
