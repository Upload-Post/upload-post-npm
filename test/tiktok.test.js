// Tests for the TikTok surface: comments on the multi-platform endpoints and
// the TikTok-only insight/discovery calls.
//
// No network: axios is given an adapter that records the request and answers
// with a canned body, so every assertion is about what the SDK would have sent.

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import FormData from 'form-data';
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
/** Axios has already serialised the JSON body by the time the adapter sees it. */
const body = () => JSON.parse(last().data);
/** Axios lowercases the verb before handing the request to the adapter. */
const method = () => last().method.toUpperCase();

/** Read back the fields a multipart upload would have written. */
function formFields(form) {
  const boundary = form.getBoundary();
  const body = form.getBuffer().toString('utf8');
  const fields = {};
  for (const part of body.split(`--${boundary}`)) {
    const match = part.match(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n$/);
    if (match) fields[match[1]] = match[2];
  }
  return fields;
}

describe('TikTok comments through the multi-platform endpoints', () => {
  test('getPostComments accepts platform tiktok', async () => {
    await client().getPostComments({
      user: 'my-profile', platform: 'tiktok', postId: '7412345678901234567', limit: 20
    });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/comments');
    assert.deepEqual(last().params, {
      platform: 'tiktok', user: 'my-profile', post_id: '7412345678901234567', limit: 20
    });
  });

  test('createComment accepts platform tiktok', async () => {
    await client().createComment({
      user: 'my-profile', platform: 'tiktok', postId: '741', message: 'hola'
    });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/comments/create');
    assert.deepEqual(body(), {
      platform: 'tiktok', user: 'my-profile', message: 'hola', post_id: '741'
    });
  });

  test('deleteComment accepts platform tiktok', async () => {
    await client().deleteComment({ user: 'my-profile', platform: 'tiktok', commentId: '99' });
    assert.equal(method(), 'DELETE');
    assert.deepEqual(body(), {
      platform: 'tiktok', user: 'my-profile', comment_id: '99'
    });
  });
});

describe('first comment', () => {
  test('tiktokFirstComment travels like every other per-platform override', () => {
    const form = new FormData();
    client()._addCommonParams(form, {
      user: 'my-profile',
      platforms: ['tiktok'],
      firstComment: 'shared',
      tiktokFirstComment: 'solo TikTok',
      instagramFirstComment: 'solo IG'
    });
    const fields = formFields(form);
    assert.equal(fields.first_comment, 'shared');
    assert.equal(fields.tiktok_first_comment, 'solo TikTok');
    assert.equal(fields.instagram_first_comment, 'solo IG');
  });

  test('tiktok is not filtered out of the upload platform list', async () => {
    await client().uploadText({
      user: 'my-profile', platforms: ['tiktok'], title: 'hi', tiktokFirstComment: 'primero'
    });
    assert.equal(formFields(last().data).tiktok_first_comment, 'primero');
  });
});

describe('TikTok comment replies and actions', () => {
  test('getTiktokCommentReplies sends the video, the comment and the cursor', async () => {
    await client().getTiktokCommentReplies('my-profile', '741', '99', { limit: 20, cursor: 'abc' });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/tiktok/comments/replies');
    assert.deepEqual(last().params, {
      profile: 'my-profile', post_id: '741', comment_id: '99', limit: 20, cursor: 'abc'
    });
  });

  test('getTiktokCommentReplies omits the optional params when unset', async () => {
    await client().getTiktokCommentReplies('my-profile', '741', '99');
    assert.deepEqual(last().params, { profile: 'my-profile', post_id: '741', comment_id: '99' });
  });

  for (const [type, action] of [['hide', 'HIDE'], ['pin', 'UNPIN']]) {
    test(`tiktokCommentAction sends post_id for ${type}`, async () => {
      await client().tiktokCommentAction('my-profile', {
        type, action, commentId: '99', postId: '741'
      });
      assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/tiktok/comments/action');
      assert.equal(method(), 'POST');
      assert.deepEqual(body(), {
        profile: 'my-profile', type, comment_id: '99', action, post_id: '741'
      });
    });
  }

  test('tiktokCommentAction never sends post_id for like', async () => {
    await client().tiktokCommentAction('my-profile', {
      type: 'like', action: 'LIKE', commentId: '99', postId: '741'
    });
    assert.deepEqual(body(), {
      profile: 'my-profile', type: 'like', comment_id: '99', action: 'LIKE'
    });
  });
});

describe('TikTok insights and discovery', () => {
  test('searchTiktokKeywords sends the keyword as q', async () => {
    await client().searchTiktokKeywords('my-profile', 'pilates');
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/tiktok/search/keywords');
    assert.deepEqual(last().params, { profile: 'my-profile', q: 'pilates' });
  });

  test('getTiktokInsights maps the date window to snake_case', async () => {
    await client().getTiktokInsights('my-profile', { startDate: '2026-07-01', endDate: '2026-07-30' });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/tiktok/insights');
    assert.deepEqual(last().params, {
      profile: 'my-profile', start_date: '2026-07-01', end_date: '2026-07-30'
    });
  });

  test('getTiktokInsights defaults the window server-side', async () => {
    await client().getTiktokInsights('my-profile');
    assert.deepEqual(last().params, { profile: 'my-profile' });
  });

  test('getTiktokVideoInsights pages with limit and cursor', async () => {
    await client().getTiktokVideoInsights('my-profile', { limit: 20, cursor: 'xyz' });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/tiktok/videos/insights');
    assert.deepEqual(last().params, { profile: 'my-profile', limit: 20, cursor: 'xyz' });
  });

  test('getTiktokHashtags maps countryCode and language', async () => {
    await client().getTiktokHashtags('my-profile', 'pilates', { countryCode: 'ES', language: 'es' });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/tiktok/hashtags');
    assert.deepEqual(last().params, {
      profile: 'my-profile', q: 'pilates', country_code: 'ES', language: 'es'
    });
  });

  test('getTiktokBenchmark without a category asks for the category list', async () => {
    await client().getTiktokBenchmark('my-profile');
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/tiktok/benchmark');
    assert.deepEqual(last().params, { profile: 'my-profile' });
  });

  test('getTiktokBenchmark with a category asks for the comparison', async () => {
    await client().getTiktokBenchmark('my-profile', 'SOFTWARE_AND_APPS');
    assert.deepEqual(last().params, { profile: 'my-profile', category: 'SOFTWARE_AND_APPS' });
  });
});

describe('errors', () => {
  test('an API error keeps the message the API sent', async () => {
    axios.defaults.adapter = async (config) => {
      const error = new Error('Request failed');
      error.response = { status: 400, data: { message: 'tiktok_reconnect_required' }, config };
      throw error;
    };
    await assert.rejects(
      () => client().searchTiktokKeywords('my-profile', 'pilates'),
      /Upload-Post API error: tiktok_reconnect_required/
    );
  });
});
