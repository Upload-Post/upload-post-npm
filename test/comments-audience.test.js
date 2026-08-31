// Tests for the question-shaped endpoints: comments (list, replies, moderate),
// audience and suggestions. Every one of them takes a `platform`; TikTok is the
// platform used here because it is the one that answers all of them today.
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

describe('comments through the multi-platform endpoints', () => {
  test('getPostComments accepts platform tiktok', async () => {
    await client().getPostComments({
      user: 'my-profile', platform: 'tiktok', postId: '7412345678901234567', limit: 20
    });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/comments');
    assert.deepEqual(last().params, {
      platform: 'tiktok', user: 'my-profile', post_id: '7412345678901234567', limit: 20
    });
  });

  test('getPostComments asks for the replies of a comment with comment_id', async () => {
    await client().getPostComments({
      user: 'my-profile', platform: 'tiktok', postId: '741', commentId: '99', limit: 20
    });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/comments');
    assert.deepEqual(last().params, {
      platform: 'tiktok', user: 'my-profile', post_id: '741', comment_id: '99', limit: 20
    });
  });

  test('getPostComments leaves comment_id out when no comment was asked for', async () => {
    await client().getPostComments({ user: 'my-profile', platform: 'tiktok', postId: '741' });
    assert.deepEqual(last().params, {
      platform: 'tiktok', user: 'my-profile', post_id: '741'
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

describe('commentAction', () => {
  for (const action of ['hide', 'unhide', 'pin', 'unpin']) {
    test(`sends post_id for ${action}`, async () => {
      await client().commentAction({
        user: 'my-profile', platform: 'tiktok', action, commentId: '99', postId: '741'
      });
      assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/comments/action');
      assert.equal(method(), 'POST');
      assert.deepEqual(body(), {
        platform: 'tiktok', user: 'my-profile', comment_id: '99', action, post_id: '741'
      });
    });
  }

  for (const action of ['like', 'unlike']) {
    test(`never sends post_id for ${action}`, async () => {
      await client().commentAction({
        user: 'my-profile', platform: 'tiktok', action, commentId: '99', postId: '741'
      });
      assert.deepEqual(body(), {
        platform: 'tiktok', user: 'my-profile', comment_id: '99', action
      });
    });
  }
});

describe('getAudience', () => {
  test('maps the date window to snake_case', async () => {
    await client().getAudience({
      user: 'my-profile', platform: 'tiktok', startDate: '2026-07-01', endDate: '2026-07-30'
    });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/audience');
    assert.deepEqual(last().params, {
      user: 'my-profile', platform: 'tiktok', start_date: '2026-07-01', end_date: '2026-07-30'
    });
  });

  test('leaves the window to the server when it is not given', async () => {
    await client().getAudience({ user: 'my-profile', platform: 'tiktok' });
    assert.deepEqual(last().params, { user: 'my-profile', platform: 'tiktok' });
  });

  test('asks for the category comparison with benchmark_category', async () => {
    await client().getAudience({
      user: 'my-profile', platform: 'tiktok', benchmarkCategory: 'SOFTWARE_AND_APPS'
    });
    assert.deepEqual(last().params, {
      user: 'my-profile', platform: 'tiktok', benchmark_category: 'SOFTWARE_AND_APPS'
    });
  });
});

describe('getSuggestions', () => {
  test('asks for hashtags with the country and language bias', async () => {
    await client().getSuggestions({
      user: 'my-profile', platform: 'tiktok', type: 'hashtags',
      q: 'pilates', countryCode: 'ES', language: 'es'
    });
    assert.equal(last().url, 'https://api.upload-post.com/api/uploadposts/suggestions');
    assert.deepEqual(last().params, {
      user: 'my-profile', platform: 'tiktok', type: 'hashtags',
      q: 'pilates', country_code: 'ES', language: 'es'
    });
  });

  test('asks for keywords with the same call', async () => {
    await client().getSuggestions({
      user: 'my-profile', platform: 'tiktok', type: 'keywords', q: 'pilates'
    });
    assert.deepEqual(last().params, {
      user: 'my-profile', platform: 'tiktok', type: 'keywords', q: 'pilates'
    });
  });
});

describe('the TikTok-only methods are gone', () => {
  test('nothing answers the old per-network names', () => {
    const c = client();
    for (const name of [
      'getTiktokCommentReplies', 'tiktokCommentAction', 'searchTiktokKeywords',
      'getTiktokInsights', 'getTiktokVideoInsights', 'getTiktokHashtags', 'getTiktokBenchmark'
    ]) {
      assert.equal(typeof c[name], 'undefined', `${name} should no longer exist`);
    }
  });

  test('the composer helpers stay', () => {
    const c = client();
    for (const name of [
      'getTiktokTrendingMusic', 'searchTiktokMusic',
      'getTiktokLocations', 'getTiktokPublishingSettings'
    ]) {
      assert.equal(typeof c[name], 'function', `${name} should still exist`);
    }
  });
});

describe('errors', () => {
  test('an API error keeps the message the API sent', async () => {
    axios.defaults.adapter = async (config) => {
      const error = new Error('Request failed');
      error.response = { status: 400, data: { message: 'platform_not_supported' }, config };
      throw error;
    };
    await assert.rejects(
      () => client().getSuggestions({ user: 'my-profile', platform: 'x', type: 'hashtags' }),
      /Upload-Post API error: platform_not_supported/
    );
  });
});
