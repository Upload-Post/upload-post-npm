// Resource endpoints (2.20.0): post actions, best times, the queue, and the
// Telegram, Bluesky and Google Business management endpoints, plus the new
// publish fields (Telegram, Bluesky, Google Business, paid partnership).
//
// No network: axios is given an adapter that records the request and answers
// with a canned body, so every assertion is about what the SDK would have sent.

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
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
const urlPath = () => last().url.replace('https://api.upload-post.com/api', '');
const camel = (name) => name.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function formFields(form) {
  const boundary = form.getBoundary();
  const body = form.getBuffer().toString('utf8');
  const fields = {};
  for (const part of body.split(`--${boundary}`)) {
    const match = part.match(/name="([^"]+)"(?:; filename="[^"]*")?\r\n(?:Content-Type: [^\r]*\r\n)?\r\n([\s\S]*?)\r\n$/);
    if (match) (fields[match[1]] ||= []).push(match[2]);
  }
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.length === 1 ? v[0] : v]));
}

// [method, HTTP verb, path, required args, defaults], one row per endpoint.
const ROWS = [["editPost", "POST", "/uploadposts/posts/edit", ["user", "platform", "post_id"], {}], ["repostPost", "POST", "/uploadposts/posts/repost", ["user", "platform"], {}], ["postAction", "POST", "/uploadposts/posts/action", ["user", "platform", "action"], {}], ["savePost", "POST", "/uploadposts/posts/save", ["user", "post_id"], {}], ["getBestTimes", "GET", "/uploadposts/best-times", ["profile_username", "platform"], {}], ["getQueueSettings", "GET", "/uploadposts/queue/settings", ["profile_username"], {}], ["updateQueueSettings", "POST", "/uploadposts/queue/settings", ["profile_username"], {}], ["getQueuePreview", "GET", "/uploadposts/queue/preview", ["profile_username"], {}], ["getNextQueueSlot", "GET", "/uploadposts/queue/next-slot", ["profile_username"], {}], ["markQueueSlotFull", "POST", "/uploadposts/queue/slot-full", ["profile_username", "slot_datetime"], {}], ["unmarkQueueSlotFull", "DELETE", "/uploadposts/queue/slot-full", ["profile_username", "slot_datetime"], {}], ["getTelegramChatInfo", "GET", "/uploadposts/telegram/chat-info", ["user"], {}], ["updateTelegramChatInfo", "PATCH", "/uploadposts/telegram/chat-info", ["user"], {}], ["getTelegramBoosts", "GET", "/uploadposts/telegram/boosts", ["user"], {}], ["getTelegramMember", "GET", "/uploadposts/telegram/members", ["user"], {}], ["moderateTelegramMember", "POST", "/uploadposts/telegram/members", ["user"], {}], ["createTelegramInviteLink", "POST", "/uploadposts/telegram/invite-links", ["user"], {}], ["editTelegramInviteLink", "PATCH", "/uploadposts/telegram/invite-links", ["user"], {}], ["revokeTelegramInviteLink", "DELETE", "/uploadposts/telegram/invite-links", ["user"], {}], ["createTelegramPrimaryInviteLink", "POST", "/uploadposts/telegram/invite-links/primary", ["user"], {}], ["answerTelegramJoinRequest", "POST", "/uploadposts/telegram/join-requests", ["user"], {}], ["getTelegramTopicIcons", "GET", "/uploadposts/telegram/topics/icons", ["user"], {}], ["createTelegramTopic", "POST", "/uploadposts/telegram/topics", ["user"], {}], ["editTelegramTopic", "PATCH", "/uploadposts/telegram/topics", ["user"], {}], ["deleteTelegramTopic", "DELETE", "/uploadposts/telegram/topics", ["user"], {}], ["unpinAllTelegramMessages", "POST", "/uploadposts/telegram/unpin-all", ["user"], {}], ["leaveTelegramChat", "POST", "/uploadposts/telegram/leave", ["user"], {}], ["answerTelegramSuggestedPost", "POST", "/uploadposts/telegram/suggested-posts", ["user"], {}], ["getTelegramUserPersonalChatMessages", "GET", "/uploadposts/telegram/users/{user_id}/personal-chat-messages", ["user", "user_id"], {}], ["getTelegramUserProfileAudios", "GET", "/uploadposts/telegram/users/{user_id}/profile-audios", ["user", "user_id"], {}], ["getTelegramShareThemeBackdrops", "GET", "/uploadposts/telegram/share-theme-backdrops", ["user"], {}], ["getTelegramUpdatesStatus", "GET", "/uploadposts/telegram/updates", ["user"], {}], ["getTelegramBotProfile", "GET", "/uploadposts/telegram/bot-profile", ["user"], {}], ["updateTelegramBotProfile", "PATCH", "/uploadposts/telegram/bot-profile", ["user"], {}], ["getTelegramBotCommands", "GET", "/uploadposts/telegram/bot-commands", ["user"], {}], ["setTelegramBotCommands", "POST", "/uploadposts/telegram/bot-commands", ["user"], {}], ["deleteTelegramBotCommands", "DELETE", "/uploadposts/telegram/bot-commands", ["user"], {}], ["getTelegramStickerSet", "GET", "/uploadposts/telegram/sticker-sets", ["user"], {}], ["createTelegramStickerSet", "POST", "/uploadposts/telegram/sticker-sets", ["user"], {}], ["editTelegramStickerSet", "PATCH", "/uploadposts/telegram/sticker-sets", ["user"], {}], ["deleteTelegramStickerSet", "DELETE", "/uploadposts/telegram/sticker-sets", ["user"], {}], ["uploadTelegramStickerFile", "POST", "/uploadposts/telegram/sticker-sets/upload", ["user"], {}], ["getTelegramStars", "GET", "/uploadposts/telegram/stars", ["user"], {}], ["getTelegramStarTransactions", "GET", "/uploadposts/telegram/stars/transactions", ["user"], {}], ["sendTelegramInvoice", "POST", "/uploadposts/telegram/invoices", ["user"], {}], ["createTelegramInvoiceLink", "POST", "/uploadposts/telegram/invoice-links", ["user"], {}], ["refundTelegramStarPayment", "POST", "/uploadposts/telegram/stars/refund", ["user"], {}], ["editTelegramStarSubscription", "POST", "/uploadposts/telegram/stars/subscription", ["user"], {}], ["getTelegramAvailableGifts", "GET", "/uploadposts/telegram/gifts", ["user"], {}], ["getTelegramOwnedGifts", "GET", "/uploadposts/telegram/gifts/owned", ["user"], {}], ["getTelegramUniqueGift", "GET", "/uploadposts/telegram/gifts/unique", ["user"], {}], ["getTelegramUnansweredPayments", "GET", "/uploadposts/telegram/payments/unanswered", ["user"], {}], ["getPostEngagement", "GET", "/uploadposts/post-engagement", ["post_id"], {"platform": "bluesky"}], ["getBlueskyProfiles", "GET", "/uploadposts/bluesky/profile", [], {}], ["searchBlueskyPosts", "GET", "/uploadposts/bluesky/search/posts", ["user", "q"], {}], ["searchBlueskyActors", "GET", "/uploadposts/bluesky/search/actors", ["q"], {}], ["getBlueskyFollowers", "GET", "/uploadposts/bluesky/followers", [], {}], ["getBlueskyFollows", "GET", "/uploadposts/bluesky/follows", [], {}], ["blueskyXrpc", "GET", "/uploadposts/bluesky/xrpc/{nsid}", ["nsid"], {}], ["getBlueskyLabels", "GET", "/uploadposts/bluesky/labels", ["user"], {}], ["getBlueskyNotifications", "GET", "/uploadposts/bluesky/notifications", ["user"], {}], ["getBlueskyUnreadCount", "GET", "/uploadposts/bluesky/notifications/unread-count", ["user"], {}], ["markBlueskyNotificationsSeen", "POST", "/uploadposts/bluesky/notifications/seen", ["user"], {}], ["getBlueskyNotificationPreferences", "GET", "/uploadposts/bluesky/notification-preferences", ["user"], {}], ["updateBlueskyNotificationPreferences", "POST", "/uploadposts/bluesky/notification-preferences", ["user"], {}], ["getBlueskyActivitySubscriptions", "GET", "/uploadposts/bluesky/activity-subscriptions", ["user"], {}], ["setBlueskyActivitySubscription", "POST", "/uploadposts/bluesky/activity-subscriptions", ["user"], {}], ["getBlueskyOwnProfile", "GET", "/uploadposts/bluesky/profile/self", ["user"], {}], ["updateBlueskyProfile", "POST", "/uploadposts/bluesky/profile/self", ["user"], {}], ["getBlueskyStatus", "GET", "/uploadposts/bluesky/status", ["user"], {}], ["setBlueskyStatus", "POST", "/uploadposts/bluesky/status", ["user"], {}], ["clearBlueskyStatus", "DELETE", "/uploadposts/bluesky/status", ["user"], {}], ["getBlueskySettings", "GET", "/uploadposts/bluesky/settings", ["user"], {}], ["updateBlueskySettings", "POST", "/uploadposts/bluesky/settings", ["user"], {}], ["getBlueskyPreferences", "GET", "/uploadposts/bluesky/preferences", ["user"], {}], ["updateBlueskyPreferences", "PUT", "/uploadposts/bluesky/preferences", ["user"], {}], ["listBlueskyDrafts", "GET", "/uploadposts/bluesky/drafts", ["user"], {}], ["createBlueskyDraft", "POST", "/uploadposts/bluesky/drafts", ["user"], {}], ["updateBlueskyDraft", "PATCH", "/uploadposts/bluesky/drafts/{draft_id}", ["user", "draft_id"], {}], ["deleteBlueskyDraft", "DELETE", "/uploadposts/bluesky/drafts/{draft_id}", ["user", "draft_id"], {}], ["getBlueskyChatStatus", "GET", "/uploadposts/dms/bluesky/status", ["user"], {}], ["getBlueskyChatPreferences", "GET", "/uploadposts/dms/bluesky/preferences", ["user"], {}], ["updateBlueskyChatPreferences", "POST", "/uploadposts/dms/bluesky/preferences", ["user"], {}], ["exportBlueskyChat", "GET", "/uploadposts/dms/bluesky/export", ["user"], {}], ["listGoogleBusinessPosts", "GET", "/uploadposts/google-business/posts", ["user"], {}], ["getGoogleBusinessPost", "GET", "/uploadposts/google-business/posts/get", ["user"], {}], ["listGoogleBusinessReviews", "GET", "/uploadposts/google-business/reviews", ["user"], {}], ["getGoogleBusinessReview", "GET", "/uploadposts/google-business/reviews/get", ["user"], {}], ["batchGetGoogleBusinessReviews", "GET", "/uploadposts/google-business/reviews/batch", ["user"], {}], ["replyToGoogleBusinessReview", "PUT", "/uploadposts/google-business/reviews/reply", ["user", "comment"], {}], ["deleteGoogleBusinessReviewReply", "DELETE", "/uploadposts/google-business/reviews/reply", ["user"], {}], ["listGoogleBusinessMedia", "GET", "/uploadposts/google-business/media", ["user"], {}], ["getGoogleBusinessMedia", "GET", "/uploadposts/google-business/media/get", ["user"], {}], ["uploadGoogleBusinessMedia", "POST", "/uploadposts/google-business/media", ["user"], {}], ["updateGoogleBusinessMedia", "PATCH", "/uploadposts/google-business/media", ["user"], {}], ["deleteGoogleBusinessMedia", "DELETE", "/uploadposts/google-business/media", ["user"], {}], ["listGoogleBusinessCustomerMedia", "GET", "/uploadposts/google-business/media/customers", ["user"], {}], ["getGoogleBusinessCustomerMedia", "GET", "/uploadposts/google-business/media/customers/get", ["user"], {}], ["getGoogleBusinessPerformance", "GET", "/uploadposts/google-business/performance", ["user"], {}], ["getGoogleBusinessSearchKeywords", "GET", "/uploadposts/google-business/performance/keywords", ["user"], {}], ["getGoogleBusinessLocationInfo", "GET", "/uploadposts/google-business/location-info", ["user"], {}], ["updateGoogleBusinessLocationInfo", "PATCH", "/uploadposts/google-business/location-info", ["user"], {}], ["getGoogleBusinessGoogleUpdates", "GET", "/uploadposts/google-business/location-info/google-updated", ["user"], {}], ["answerGoogleBusinessGoogleUpdates", "POST", "/uploadposts/google-business/location-info/google-updates", ["user", "decision", "fields"], {}], ["getGoogleBusinessLocationInfoExtended", "GET", "/uploadposts/google-business/location-info/extended", ["user"], {}], ["listGoogleBusinessLocations", "GET", "/uploadposts/google-business/locations/list", ["user"], {}], ["getGoogleBusinessPinnedLocation", "GET", "/uploadposts/users/google-business-location", ["profile_username"], {}], ["pinGoogleBusinessLocation", "POST", "/uploadposts/users/google-business-location", ["profile_username", "gbp_location_id"], {}], ["clearGoogleBusinessLocationPin", "DELETE", "/uploadposts/users/google-business-location", ["profile_username"], {}], ["searchGoogleBusinessCategories", "GET", "/uploadposts/google-business/categories", [], {}], ["batchGetGoogleBusinessCategories", "GET", "/uploadposts/google-business/categories/batch", [], {}], ["searchGoogleBusinessChains", "GET", "/uploadposts/google-business/chains", [], {}], ["getGoogleBusinessChain", "GET", "/uploadposts/google-business/chains/get", [], {}], ["searchGoogleBusinessGoogleLocations", "POST", "/uploadposts/google-business/google-locations/search", ["user"], {}], ["getGoogleBusinessRecommendedLocations", "GET", "/uploadposts/google-business/google-locations/recommended", ["user"], {}], ["reportGoogleBusinessGoogleLocation", "POST", "/uploadposts/google-business/google-locations/report", ["user"], {}], ["getGoogleBusinessAvailableAttributes", "GET", "/uploadposts/google-business/attributes/available", ["user"], {}], ["getGoogleBusinessAttributes", "GET", "/uploadposts/google-business/attributes", ["user"], {}], ["updateGoogleBusinessAttributes", "PATCH", "/uploadposts/google-business/attributes", ["user"], {}], ["getGoogleBusinessAttributesGoogleUpdated", "GET", "/uploadposts/google-business/attributes/google-updated", ["user"], {}], ["getGoogleBusinessAttributesExtended", "GET", "/uploadposts/google-business/attributes/extended", ["user"], {}], ["getGoogleBusinessPlaceActionTypes", "GET", "/uploadposts/google-business/place-actions/types", ["user"], {}], ["listGoogleBusinessPlaceActions", "GET", "/uploadposts/google-business/place-actions", ["user"], {}], ["getGoogleBusinessPlaceAction", "GET", "/uploadposts/google-business/place-actions/get", ["user"], {}], ["createGoogleBusinessPlaceAction", "POST", "/uploadposts/google-business/place-actions", ["user"], {}], ["updateGoogleBusinessPlaceAction", "PATCH", "/uploadposts/google-business/place-actions", ["user"], {}], ["deleteGoogleBusinessPlaceAction", "DELETE", "/uploadposts/google-business/place-actions", ["user"], {}], ["getGoogleBusinessFoodMenus", "GET", "/uploadposts/google-business/food-menus", ["user"], {}], ["updateGoogleBusinessFoodMenus", "PUT", "/uploadposts/google-business/food-menus", ["user"], {}], ["getGoogleBusinessServices", "GET", "/uploadposts/google-business/services", ["user"], {}], ["updateGoogleBusinessServices", "PUT", "/uploadposts/google-business/services", ["user"], {}], ["getGoogleBusinessLodging", "GET", "/uploadposts/google-business/lodging", ["user"], {}], ["updateGoogleBusinessLodging", "PATCH", "/uploadposts/google-business/lodging", ["user"], {}], ["getGoogleBusinessLodgingGoogleUpdated", "GET", "/uploadposts/google-business/lodging/google-updated", ["user"], {}], ["listGoogleBusinessAccounts", "GET", "/uploadposts/google-business/accounts", ["user"], {}], ["getGoogleBusinessAccount", "GET", "/uploadposts/google-business/accounts/get", ["user"], {}], ["createGoogleBusinessAccount", "POST", "/uploadposts/google-business/accounts", ["user"], {}], ["listGoogleBusinessAdmins", "GET", "/uploadposts/google-business/admins", ["user"], {}], ["listGoogleBusinessInvitations", "GET", "/uploadposts/google-business/invitations", ["user"], {}], ["getGoogleBusinessVerificationState", "GET", "/uploadposts/google-business/verification/state", ["user"], {}], ["getGoogleBusinessVerificationOptions", "POST", "/uploadposts/google-business/verification/options", ["user"], {}], ["listGoogleBusinessVerifications", "GET", "/uploadposts/google-business/verifications", ["user"], {}]];

describe('every resource method hits its endpoint', () => {
  for (const [name, verb, route, args, defaults] of ROWS) {
    test(`${name} -> ${verb} ${route}`, async () => {
      const options = { pageSize: 5, includeExtra: true };
      for (const arg of args) options[camel(arg)] = `v_${arg}`;
      await client()[name](options);

      assert.equal(last().method.toUpperCase(), verb);
      const expectedPath = route.replace(/\{(\w+)\}/g, (_, p) => `v_${p}`);
      assert.equal(urlPath(), expectedPath);

      const expected = { ...defaults, page_size: 5, include_extra: verb === 'GET' ? 'true' : true };
      for (const arg of args) if (!route.includes(`{${arg}}`)) expected[arg] = `v_${arg}`;
      const payload = verb === 'GET' ? last().params : JSON.parse(last().data);
      assert.deepEqual(payload, expected);
    });
  }
});

describe('the resource helper', () => {
  test('GET joins arrays, stringifies booleans and objects, drops undefined', async () => {
    await client().getGoogleBusinessPerformance({
      user: 'shop', metrics: ['call_clicks', 'website_clicks'], dailyRange: { a: 1 }, refresh: false, skip: undefined,
    });
    assert.deepEqual(last().params, {
      user: 'shop', metrics: 'call_clicks,website_clicks', daily_range: '{"a":1}', refresh: 'false',
    });
  });

  test('keys the API spells in camelCase are kept', async () => {
    await client().batchGetGoogleBusinessReviews({ user: 'shop', ignoreRatingOnlyReviews: true });
    assert.deepEqual(last().params, { user: 'shop', ignoreRatingOnlyReviews: 'true' });
  });

  test('nested objects are sent untouched', async () => {
    await client().updateTelegramBotProfile({ user: 'p', menuButton: { type: 'web_app', webApp: { url: 'https://x' } } });
    assert.deepEqual(JSON.parse(last().data), { user: 'p', menu_button: { type: 'web_app', webApp: { url: 'https://x' } } });
  });

  test('a missing path parameter fails before any request', async () => {
    await assert.rejects(() => client().updateBlueskyDraft({ user: 'p' }), /draft_id is required/);
    assert.equal(sent.length, 0);
  });

  test('path parameters are URL-encoded', async () => {
    await client().blueskyXrpc({ nsid: 'app.bsky.feed.getAuthorFeed', actor: 'alice.bsky.social' });
    assert.equal(urlPath(), '/uploadposts/bluesky/xrpc/app.bsky.feed.getAuthorFeed');
    assert.deepEqual(last().params, { actor: 'alice.bsky.social' });
  });

  test('a local file turns the request into multipart', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-'));
    const file = path.join(dir, 'front.jpg');
    fs.writeFileSync(file, 'jpegbytes');
    await client().uploadGoogleBusinessMedia({ user: 'shop', file, category: 'EXTERIOR', dryRun: false });
    assert.ok(last().data instanceof FormData);
    assert.equal(last().method.toUpperCase(), 'POST');
    assert.equal(urlPath(), '/uploadposts/google-business/media');
  });

  test('a Buffer in a file field is multipart with the other fields as strings', async () => {
    await client().updateTelegramChatInfo({ user: 'p', photo: Buffer.from('img'), permissions: { can_send_messages: true } });
    const fields = formFields(last().data);
    assert.equal(fields.user, 'p');
    assert.equal(fields.permissions, '{"can_send_messages":true}');
    assert.equal(fields.photo, 'img');
  });

  test('a URL in a file field stays JSON', async () => {
    await client().uploadGoogleBusinessMedia({ user: 'shop', file: 'https://example.com/a.jpg' });
    assert.deepEqual(JSON.parse(last().data), { user: 'shop', file: 'https://example.com/a.jpg' });
  });

  test('getPostEngagement defaults to bluesky and lets it be overridden', async () => {
    await client().getPostEngagement({ postId: 'at://x' });
    assert.deepEqual(last().params, { platform: 'bluesky', post_id: 'at://x' });
  });

  test('updateQueueSettings sends slots=auto as given', async () => {
    await client().updateQueueSettings({ profileUsername: 'p', slots: 'auto', autoSlotsCount: 3, autoPlatforms: ['instagram', 'tiktok'] });
    assert.deepEqual(JSON.parse(last().data), {
      profile_username: 'p', slots: 'auto', auto_slots_count: 3, auto_platforms: ['instagram', 'tiktok'],
    });
  });

  test('unpublishPost passes extra options such as deleteAllMessages', async () => {
    await client().unpublishPost({ user: 'p', platform: 'telegram', postId: '42', deleteAllMessages: true });
    assert.deepEqual(JSON.parse(last().data), { platform: 'telegram', user: 'p', post_id: '42', delete_all_messages: true });
  });

  test('selectGoogleBusinessLocation pins when given a location and a profile', async () => {
    await client().selectGoogleBusinessLocation('locations/1', 'acme');
    assert.equal(last().method.toUpperCase(), 'POST');
    assert.equal(urlPath(), '/uploadposts/users/google-business-location');
    assert.deepEqual(JSON.parse(last().data), { profile_username: 'acme', gbp_location_id: 'locations/1' });
  });
});

describe('new publish fields', () => {
  const textForm = async (options) => {
    await client().uploadText({ user: 'p', title: 'hi', ...options });
    return formFields(last().data);
  };

  test('Telegram options reach the form, objects as JSON', async () => {
    const f = await textForm({
      platforms: ['telegram'],
      telegramPoll: { question: 'Q?', options: ['a', 'b'] },
      telegramDice: true,
      telegramPin: true,
      telegramReplyToMessageId: 7,
      telegramLinkPreviewOptions: { is_disabled: true },
      telegramTitle: 'Texto',
      telegramFirstComment: 'c',
      telegram_venue: { latitude: 1, longitude: 2, title: 't', address: 'a' },
    });
    assert.equal(f.telegram_poll, '{"question":"Q?","options":["a","b"]}');
    assert.equal(f.telegram_dice, 'true');
    assert.equal(f.telegram_pin, 'true');
    assert.equal(f.telegram_reply_to_message_id, '7');
    assert.equal(f.telegram_link_preview_options, '{"is_disabled":true}');
    assert.equal(f.telegram_title, 'Texto');
    assert.equal(f.telegram_first_comment, 'c');
    assert.equal(f.telegram_venue, '{"latitude":1,"longitude":2,"title":"t","address":"a"}');
  });

  test('Telegram fields are not sent when Telegram is not a target', async () => {
    const f = await textForm({ platforms: ['x'], telegramPoll: { question: 'Q?' } });
    assert.equal(f.telegram_poll, undefined);
  });

  test('Bluesky options reach the form', async () => {
    const f = await textForm({
      platforms: ['bluesky'], blueskyTags: ['a', 'b'], blueskyCreatedAt: '2024-05-01T10:30:00Z',
      blueskyThreadOverflow: true, blueskyVideoPresentation: 'gif',
    });
    assert.equal(f.bluesky_tags, '["a","b"]');
    assert.equal(f.bluesky_created_at, '2024-05-01T10:30:00Z');
    assert.equal(f.bluesky_thread_overflow, 'true');
    assert.equal(f.bluesky_video_presentation, 'gif');
  });

  test('Google Business recurrence, scheduling and several photos', async () => {
    const f = await textForm({
      platforms: ['google_business'], gbpTopicType: 'EVENT', gbpRecurrence: 'WEEKLY', gbpRecurrenceDays: 'MON,THU',
      gbpRecurrenceEnd: '2027-01-01', gbpScheduledTime: '2026-12-01T10:00:00+01:00', gbpMultiMedia: true,
      gbpMediaUrl: ['https://a/1.jpg', 'https://a/2.jpg'], gbpAlertType: 'COVID_19',
    });
    assert.equal(f.gbp_recurrence, 'WEEKLY');
    assert.equal(f.gbp_recurrence_days, 'MON,THU');
    assert.equal(f.gbp_recurrence_end, '2027-01-01');
    assert.equal(f.gbp_scheduled_time, '2026-12-01T10:00:00+01:00');
    assert.equal(f.gbp_multi_media, 'true');
    assert.deepEqual(f['gbp_media_url[]'], ['https://a/1.jpg', 'https://a/2.jpg']);
    assert.equal(f.gbp_alert_type, 'COVID_19');
  });

  test('paid partnership: common flag and per-network fields', async () => {
    const f = await textForm({ platforms: ['facebook', 'x'], paidPartnership: true, facebookSponsorId: '123' });
    assert.equal(f.paid_partnership, 'true');
    assert.equal(f.facebook_sponsor_id, '123');
  });

  test('TikTok commercial disclosure on photos', async () => {
    await client().uploadPhotos(['https://example.com/a.jpg'], {
      user: 'p', platforms: ['tiktok', 'pinterest'], tiktokDiscloseCommercial: true, brandedContent: true, pinterestSponsorId: '9',
    });
    const f = formFields(last().data);
    assert.equal(f.disclose_commercial, 'true');
    assert.equal(f.branded_content, 'true');
    assert.equal(f.pinterest_sponsor_id, '9');
  });
});

describe('generateJwt', () => {
  const spec = JSON.parse(fs.readFileSync(new URL('../codegen/openapi.json', import.meta.url)));
  const resolve = (node) => {
    while (node && node.$ref) node = node.$ref.slice(2).split('/').reduce((n, part) => n[part], spec);
    return node || {};
  };
  const sample = (schema) => {
    schema = resolve(schema);
    if (schema.type === 'boolean') return true;
    if (schema.type === 'array') return ['tiktok'];
    if (schema.type === 'object') return { 'connect.title': 'x' };
    return schema.enum ? schema.enum[0] : 'x';
  };

  test('sends every body field of the spec', async () => {
    const op = spec.paths['/uploadposts/users/generate-jwt'].post;
    const schema = resolve(op.requestBody.content['application/json'].schema);
    const options = {};
    for (const [name, prop] of Object.entries(schema.properties)) {
      if (name !== 'username') options[camel(name)] = sample(prop);
    }
    await client().generateJwt('p', options);
    const body = JSON.parse(last().data);
    for (const name of Object.keys(schema.properties)) {
      assert.ok(name in body, `generateJwt drops ${name}`);
    }
  });

  test('clientApproval false is sent, not dropped', async () => {
    await client().generateJwt('p', { clientApproval: false });
    assert.equal(JSON.parse(last().data).client_approval, false);
  });

  test('validateJwt is a GET with the token as Bearer', async () => {
    await client().validateJwt('tok');
    assert.equal(last().method, 'get');
    assert.equal(urlPath(), '/uploadposts/users/validate-jwt');
    assert.equal(last().headers.Authorization, 'Bearer tok');
  });
});
