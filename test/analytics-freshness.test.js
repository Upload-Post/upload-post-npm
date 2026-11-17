// Tests for the analytics freshness endpoints and parameters: refresh, the
// daily history of a post, /cached sort / origin / date_field, the period of
// /api/analytics, insights and analytics status.
//
// No network: axios is given an adapter that records the request and answers
// with a canned body, so every assertion is about what the SDK would have sent.

import { test, describe, beforeEach } from 'node:test';
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
const last = () => sent[sent.length - 1];
const API = 'https://api.upload-post.com/api';

describe('post analytics', () => {
  test('getPostAnalytics(requestId) sends no query, as before', async () => {
    await client().getPostAnalytics('req-1');
    assert.equal(last().url, `${API}/uploadposts/post-analytics/req-1`);
    assert.equal(last().params, undefined);
  });

  test('getPostAnalytics passes platform and refresh', async () => {
    await client().getPostAnalytics('req-1', { platform: 'tiktok', refresh: true });
    assert.deepEqual(last().params, { platform: 'tiktok', refresh: 'true' });
  });

  test('refresh false is not sent', async () => {
    await client().getPostAnalytics('req-1', { refresh: false });
    assert.equal(last().params, undefined);
  });

  test('getPostAnalyticsByPlatformId keeps its three arguments and adds refresh', async () => {
    await client().getPostAnalyticsByPlatformId('7300', 'x', 'brand');
    assert.deepEqual(last().params, { platform_post_id: '7300', platform: 'x', user: 'brand' });
    await client().getPostAnalyticsByPlatformId('7300', 'x', 'brand', { refresh: true });
    assert.deepEqual(last().params, { platform_post_id: '7300', platform: 'x', user: 'brand', refresh: 'true' });
  });
});

describe('daily history', () => {
  test('getPostAnalyticsDaily goes to /{request_id}/daily with platform', async () => {
    await client().getPostAnalyticsDaily('req 1', { platform: 'tiktok', since: '2026-11-01', until: '2026-11-15' });
    assert.equal(last().url, `${API}/uploadposts/post-analytics/req%201/daily`);
    assert.deepEqual(last().params, { platform: 'tiktok', since: '2026-11-01', until: '2026-11-15' });
  });

  test('getPostAnalyticsDaily without platform is refused before any request', async () => {
    await assert.rejects(() => client().getPostAnalyticsDaily('req-1'), /platform/);
    assert.equal(sent.length, 0);
  });

  test('getPostAnalyticsDailyByPlatformId', async () => {
    await client().getPostAnalyticsDailyByPlatformId('7300', 'youtube', 'brand', { since: '2026-11-01' });
    assert.equal(last().url, `${API}/uploadposts/post-analytics/daily`);
    assert.deepEqual(last().params, { platform_post_id: '7300', platform: 'youtube', user: 'brand', since: '2026-11-01' });
  });
});

describe('cached post analytics', () => {
  test('without the new options the query is the same as before', async () => {
    await client().getCachedPostAnalytics('brand', { platform: 'tiktok', limit: 50 });
    assert.deepEqual(last().params, { user: 'brand', platform: 'tiktok', limit: 50 });
  });

  test('sort, order, dateField and origin reach the API under its names', async () => {
    await client().getCachedPostAnalytics('brand', {
      sort: '-views', order: 'desc', dateField: 'published_at', origin: 'all', since: '2026-10-01',
    });
    assert.equal(last().url, `${API}/uploadposts/post-analytics/cached`);
    assert.deepEqual(last().params, {
      user: 'brand', since: '2026-10-01', sort: '-views', order: 'desc', date_field: 'published_at', origin: 'all',
    });
  });
});

describe('account analytics period', () => {
  test('getAnalytics passes since, until and compare', async () => {
    await client().getAnalytics('brand', { platforms: ['instagram', 'youtube'], since: '2026-10-17', until: '2026-11-15', compare: 'previous' });
    assert.equal(last().url, `${API}/analytics/brand`);
    assert.deepEqual(last().params, { platforms: 'instagram,youtube', since: '2026-10-17', until: '2026-11-15', compare: 'previous' });
  });

  test('getAnalytics without them is unchanged', async () => {
    await client().getAnalytics('brand', { platforms: ['tiktok'] });
    assert.deepEqual(last().params, { platforms: 'tiktok' });
  });
});

describe('insights and analytics status', () => {
  test('getInsights', async () => {
    await client().getInsights({ user: 'brand', platform: 'tiktok', since: '2026-10-01', until: '2026-11-15' });
    assert.equal(last().method.toUpperCase(), 'GET');
    assert.equal(last().url, `${API}/uploadposts/insights`);
    assert.deepEqual(last().params, { user: 'brand', platform: 'tiktok', since: '2026-10-01', until: '2026-11-15' });
  });

  test('getAnalyticsStatus with and without a profile', async () => {
    await client().getAnalyticsStatus();
    assert.equal(last().url, `${API}/uploadposts/analytics-status`);
    assert.equal(last().params, undefined);
    await client().getAnalyticsStatus({ user: 'brand', platform: 'x' });
    assert.deepEqual(last().params, { user: 'brand', platform: 'x' });
  });
});
