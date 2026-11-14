// Webhook delivery log, account-wide AutoDM rules and monitors, direct messages
// (Bluesky included), LinkedIn organization lookup, teams and error details.
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

const client = (opts) => new UploadPost('test-key', opts);
const last = () => sent[sent.length - 1];
const body = () => JSON.parse(last().data);
const method = () => last().method.toUpperCase();
const path = () => last().url.replace('https://api.upload-post.com/api', '');

describe('webhook delivery log', () => {
  test('listWebhookDeliveries maps every filter to the API names', async () => {
    await client().listWebhookDeliveries({
      event: 'upload_completed', status: 'failed', requestId: 'r1', jobId: 'j1',
      profileUsername: 'p1', limit: 50, page: 2, includePayload: true,
    });
    assert.equal(method(), 'GET');
    assert.equal(path(), '/uploadposts/webhooks/deliveries');
    assert.deepEqual(last().params, {
      event: 'upload_completed', status: 'failed', request_id: 'r1', job_id: 'j1',
      profile_username: 'p1', limit: 50, page: 2, include_payload: 'true',
    });
  });

  test('listWebhookDeliveries without filters sends none', async () => {
    await client().listWebhookDeliveries();
    assert.deepEqual(last().params, {});
  });

  test('getWebhookDelivery and redeliverWebhook address the delivery by id', async () => {
    await client().getWebhookDelivery('abc/def');
    assert.equal(method(), 'GET');
    assert.equal(path(), '/uploadposts/webhooks/deliveries/abc%2Fdef');

    await client().redeliverWebhook('3f1c');
    assert.equal(method(), 'POST');
    assert.equal(path(), '/uploadposts/webhooks/deliveries/3f1c/redeliver');
  });
});

describe('webhook configuration', () => {
  test('updateNotificationConfig passes channels as an object', async () => {
    await client().updateNotificationConfig({
      webhookUrl: 'https://example.com/h', webhookEvents: ['dm_received'], channels: { webhook: true },
    });
    assert.deepEqual(body(), {
      webhook_url: 'https://example.com/h', webhook_events: ['dm_received'], channels: { webhook: true },
    });
  });

  test('deleteNotificationWebhook and rotateWebhookSecret', async () => {
    await client().deleteNotificationWebhook();
    assert.equal(method(), 'DELETE');
    assert.equal(path(), '/uploadposts/users/notifications');

    await client().rotateWebhookSecret();
    assert.equal(method(), 'POST');
    assert.equal(path(), '/uploadposts/users/webhook-secret');
  });

  test('profile webhook: get, set (events kept, cleared or replaced) and delete', async () => {
    await client().getProfileWebhook('p1');
    assert.equal(method(), 'GET');
    assert.deepEqual(last().params, { profile_username: 'p1' });

    await client().setProfileWebhook({ profileUsername: 'p1', webhookUrl: 'https://example.com/p1' });
    assert.deepEqual(body(), { profile_username: 'p1', webhook_url: 'https://example.com/p1' });

    await client().setProfileWebhook({ profileUsername: 'p1', webhookUrl: 'https://e.com', webhookEvents: null });
    assert.equal(body().webhook_events, null);

    await client().setProfileWebhook({
      profileUsername: 'p1', webhookUrl: 'https://e.com', webhookEvents: { comment_received: true },
    });
    assert.deepEqual(body().webhook_events, { comment_received: true });

    await client().deleteProfileWebhook('p1');
    assert.equal(method(), 'DELETE');
    assert.equal(path(), '/uploadposts/users/profile-webhook');
    assert.deepEqual(body(), { profile_username: 'p1' });
  });
});

describe('AutoDM', () => {
  test('createAutodmRule maps the rule fields, cooldown 0 included', async () => {
    await client().createAutodmRule({
      profileUsername: 'p1',
      replyMessage: 'Here you go',
      triggers: ['comment', 'dm_keyword'],
      triggerKeywords: ['guide'],
      buttons: [{ title: 'Guide', url: 'https://example.com' }],
      perUserCooldownHours: 0,
    });
    assert.equal(method(), 'POST');
    assert.equal(path(), '/uploadposts/autodms/rules');
    assert.deepEqual(body(), {
      profile_username: 'p1',
      reply_message: 'Here you go',
      triggers: ['comment', 'dm_keyword'],
      trigger_keywords: ['guide'],
      buttons: [{ title: 'Guide', url: 'https://example.com' }],
      per_user_cooldown_hours: 0,
    });
  });

  test('createAutodmRule with an explicit empty keyword list still sends it', async () => {
    await client().createAutodmRule({ profileUsername: 'p1', replyMessage: 'x', triggerKeywords: [] });
    assert.deepEqual(body().trigger_keywords, []);
  });

  test('listAutodmRules filters by profile', async () => {
    await client().listAutodmRules({ profileUsername: 'p1' });
    assert.equal(method(), 'GET');
    assert.equal(path(), '/uploadposts/autodms/rules');
    assert.deepEqual(last().params, { profile_username: 'p1' });
  });

  for (const [fn, action] of [['pauseAutodmRule', 'pause'], ['resumeAutodmRule', 'resume'], ['deleteAutodmRule', 'delete']]) {
    test(`${fn} posts the rule_id to /autodms/rules/${action}`, async () => {
      await client()[fn]('rule_1');
      assert.equal(method(), 'POST');
      assert.equal(path(), `/uploadposts/autodms/rules/${action}`);
      assert.deepEqual(body(), { rule_id: 'rule_1' });
    });
  }

  test('startAutodm maps a public-reply monitor', async () => {
    await client().startAutodm({
      profileUsername: 'p1', platform: 'tiktok', postId: '741', replyMessage: 'Thanks!',
      replyMessages: ['Thanks!', 'Merci!'], monitoringInterval: 30, triggerKeywords: 'love',
    });
    assert.equal(path(), '/uploadposts/autodms/start');
    assert.deepEqual(body(), {
      profile_username: 'p1', reply_message: 'Thanks!', platform: 'tiktok', post_id: '741',
      reply_messages: ['Thanks!', 'Merci!'], monitoring_interval: 30, trigger_keywords: 'love',
    });
  });

  for (const [fn, action] of [['stopAutodm', 'stop'], ['pauseAutodm', 'pause'], ['resumeAutodm', 'resume'], ['deleteAutodm', 'delete']]) {
    test(`${fn} posts the monitor_id to /autodms/${action}`, async () => {
      await client()[fn]('m1');
      assert.equal(path(), `/uploadposts/autodms/${action}`);
      assert.deepEqual(body(), { monitor_id: 'm1' });
    });
  }

  test('getAutodmStatus and getAutodmLogs', async () => {
    await client().getAutodmStatus({ includeInactive: true });
    assert.equal(path(), '/uploadposts/autodms/status');
    assert.deepEqual(last().params, { include_inactive: 'true' });

    await client().getAutodmLogs('m1');
    assert.equal(path(), '/uploadposts/autodms/logs');
    assert.deepEqual(last().params, { monitor_id: 'm1' });
  });
});

describe('direct messages', () => {
  test('sendDm maps the Bluesky fields and keeps unknown keys as given', async () => {
    await client().sendDm({
      platform: 'bluesky',
      user: 'p1',
      conversationId: 'convo1',
      senderAction: 'react',
      messageId: 'msg1',
      reaction: '🔥',
      replyTo: 'msg0',
      future_field: 'kept',
      ignored: undefined,
    });
    assert.equal(method(), 'POST');
    assert.equal(path(), '/uploadposts/dms/send');
    assert.deepEqual(body(), {
      platform: 'bluesky', user: 'p1', conversation_id: 'convo1', sender_action: 'react',
      message_id: 'msg1', reaction: '🔥', reply_to: 'msg0', future_field: 'kept',
    });
  });

  test('sendDm maps Instagram and WhatsApp rich fields', async () => {
    await client().sendDm({
      platform: 'instagram', user: 'p1', recipientId: '178', message: 'hi',
      quickReplies: [{ title: 'Yes' }], genericTemplate: { title: 'T' },
    });
    assert.deepEqual(body(), {
      platform: 'instagram', user: 'p1', recipient_id: '178', message: 'hi',
      quick_replies: [{ title: 'Yes' }], generic_template: { title: 'T' },
    });

    await client().sendDm({ platform: 'whatsapp', user: 'p1', recipientId: '346', ctaUrl: { url: 'https://e.com' } });
    assert.deepEqual(body().cta_url, { url: 'https://e.com' });
  });

  test('getDmConversations maps the Bluesky filters', async () => {
    await client().getDmConversations({
      platform: 'bluesky', user: 'p1', limit: 25, cursor: 'c1', participantId: 'alice.bsky.social',
      messagesLimit: 1, conversationId: 'convo1', messagesCursor: 'mc', status: 'request', readState: 'unread',
    });
    assert.equal(method(), 'GET');
    assert.equal(path(), '/uploadposts/dms/conversations');
    assert.deepEqual(last().params, {
      platform: 'bluesky', user: 'p1', limit: 25, cursor: 'c1', participant_id: 'alice.bsky.social',
      messages_limit: 1, conversation_id: 'convo1', messages_cursor: 'mc', status: 'request', read_state: 'unread',
    });
  });
});

describe('LinkedIn and teams', () => {
  test('resolveLinkedinOrganization sends user and url', async () => {
    await client().resolveLinkedinOrganization({ user: 'p1', url: 'https://www.linkedin.com/company/linkedin/' });
    assert.equal(method(), 'GET');
    assert.equal(path(), '/uploadposts/linkedin/resolve-organization');
    assert.deepEqual(last().params, { user: 'p1', url: 'https://www.linkedin.com/company/linkedin/' });
  });

  test('listTeamMembers and listSharedAccounts', async () => {
    await client().listTeamMembers();
    assert.equal(path(), '/uploadposts/teams/members');
    await client().listSharedAccounts();
    assert.equal(path(), '/uploadposts/teams/shared-with-me');
  });

  test('actAsUser sends X-Act-As-User on every request; absent by default', async () => {
    await client({ actAsUser: 'owner@example.com' }).listUsers();
    assert.equal(last().headers['X-Act-As-User'], 'owner@example.com');

    await client().listUsers();
    assert.equal(last().headers['X-Act-As-User'], undefined);
  });
});

describe('errors carry the machine-readable details', () => {
  const failWith = (status, data, headers = {}) => {
    axios.defaults.adapter = async (config) => {
      const response = { data, status, statusText: 'ERR', headers, config };
      throw new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response);
    };
  };

  test('TEAM_SEAT_SUSPENDED comes back as error.code with its reason', async () => {
    failWith(403, {
      success: false, code: 'TEAM_SEAT_SUSPENDED', reason: 'owner_plan_limit',
      message: "The account owner's current plan no longer covers your team seat.",
    });
    await assert.rejects(client({ actAsUser: 'owner@example.com' }).listUsers(), (err) => {
      assert.equal(err.status, 403);
      assert.equal(err.code, 'TEAM_SEAT_SUSPENDED');
      assert.equal(err.reason, 'owner_plan_limit');
      assert.match(err.message, /^Upload-Post API error: The account owner's current plan/);
      return true;
    });
  });

  test('error_code bodies (Bluesky) expose code, errorCode and Retry-After', async () => {
    failWith(429, { success: false, error: 'Bluesky is rate limiting', error_code: 'bluesky_rate_limited' },
      { 'retry-after': '30' });
    await assert.rejects(client().sendDm({ platform: 'bluesky', user: 'p1', recipientId: 'a', message: 'x' }), (err) => {
      assert.equal(err.code, 'bluesky_rate_limited');
      assert.equal(err.errorCode, 'bluesky_rate_limited');
      assert.equal(err.retryAfter, 30);
      assert.equal(err.message, 'Upload-Post API error: Bluesky is rate limiting');
      assert.equal(err.response.error_code, 'bluesky_rate_limited');
      return true;
    });
  });

  test('a redelivery conflict exposes its reason', async () => {
    failWith(409, { success: false, message: 'This webhook is no longer configured', reason: 'webhook_removed' });
    await assert.rejects(client().redeliverWebhook('d1'), (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.reason, 'webhook_removed');
      assert.equal(err.code, undefined);
      return true;
    });
  });
});
