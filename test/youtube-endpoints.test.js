// YouTube resource endpoints (2.21.0): videos, quota, thumbnail, playlists,
// captions, comments, search and catalogs, subscriptions/ratings/reports,
// channel settings, live broadcasts and streams, live chat; plus the new
// upload and edit fields.
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
const ROWS = [["getYoutubeVideos", "GET", "/uploadposts/youtube/videos", ["user"], {}], ["getYoutubeQuota", "GET", "/uploadposts/youtube/quota", [], {}], ["setYoutubeThumbnail", "POST", "/uploadposts/youtube/thumbnail", ["user", "video_id"], {}], ["listYoutubePlaylists", "GET", "/uploadposts/youtube/playlists", ["user"], {}], ["createYoutubePlaylist", "POST", "/uploadposts/youtube/playlists", ["user"], {}], ["updateYoutubePlaylist", "PATCH", "/uploadposts/youtube/playlists/{playlist_id}", ["user", "playlist_id"], {}], ["deleteYoutubePlaylist", "DELETE", "/uploadposts/youtube/playlists/{playlist_id}", ["user", "playlist_id"], {}], ["listYoutubePlaylistItems", "GET", "/uploadposts/youtube/playlists/{playlist_id}/items", ["user", "playlist_id"], {}], ["addYoutubePlaylistItem", "POST", "/uploadposts/youtube/playlists/{playlist_id}/items", ["user", "playlist_id"], {}], ["updateYoutubePlaylistItem", "PATCH", "/uploadposts/youtube/playlists/{playlist_id}/items/{item_id}", ["user", "playlist_id", "item_id"], {}], ["deleteYoutubePlaylistItem", "DELETE", "/uploadposts/youtube/playlists/{playlist_id}/items/{item_id}", ["user", "playlist_id", "item_id"], {}], ["getYoutubePlaylistImage", "GET", "/uploadposts/youtube/playlists/{playlist_id}/image", ["user", "playlist_id"], {}], ["setYoutubePlaylistImage", "POST", "/uploadposts/youtube/playlists/{playlist_id}/image", ["user", "playlist_id"], {}], ["replaceYoutubePlaylistImage", "PUT", "/uploadposts/youtube/playlists/{playlist_id}/image", ["user", "playlist_id"], {}], ["deleteYoutubePlaylistImage", "DELETE", "/uploadposts/youtube/playlists/{playlist_id}/image", ["user", "playlist_id"], {}], ["listYoutubeCaptions", "GET", "/uploadposts/youtube/captions", ["user", "video_id"], {}], ["uploadYoutubeCaption", "POST", "/uploadposts/youtube/captions", ["user", "video_id"], {}], ["updateYoutubeCaption", "PUT", "/uploadposts/youtube/captions/{caption_id}", ["user", "caption_id"], {}], ["downloadYoutubeCaption", "GET", "/uploadposts/youtube/captions/{caption_id}/download", ["user", "caption_id"], {}], ["deleteYoutubeCaption", "DELETE", "/uploadposts/youtube/captions/{caption_id}", ["user", "caption_id"], {}], ["listYoutubeComments", "GET", "/uploadposts/youtube/comments", ["user"], {}], ["listYoutubeCommentReplies", "GET", "/uploadposts/youtube/comments/replies", ["user"], {}], ["createYoutubeComment", "POST", "/uploadposts/youtube/comments", ["user", "text"], {}], ["updateYoutubeComment", "PATCH", "/uploadposts/youtube/comments/{comment_id}", ["user", "comment_id"], {}], ["deleteYoutubeComment", "DELETE", "/uploadposts/youtube/comments/{comment_id}", ["user", "comment_id"], {}], ["moderateYoutubeComments", "POST", "/uploadposts/youtube/comments/moderate", ["user", "comment_ids", "status"], {}], ["searchYoutube", "GET", "/uploadposts/youtube/search", ["user"], {}], ["getYoutubeCategories", "GET", "/uploadposts/youtube/categories", [], {}], ["getYoutubeLanguages", "GET", "/uploadposts/youtube/languages", [], {}], ["getYoutubeRegions", "GET", "/uploadposts/youtube/regions", [], {}], ["getYoutubeAbuseReasons", "GET", "/uploadposts/youtube/abuse-reasons", [], {}], ["listYoutubeSubscriptions", "GET", "/uploadposts/youtube/subscriptions", ["user"], {}], ["subscribeYoutubeChannel", "POST", "/uploadposts/youtube/subscriptions", ["user"], {}], ["unsubscribeYoutubeChannel", "DELETE", "/uploadposts/youtube/subscriptions/{subscription_id}", ["user", "subscription_id"], {}], ["rateYoutubeVideo", "POST", "/uploadposts/youtube/videos/{video_id}/rate", ["user", "video_id"], {}], ["getYoutubeRating", "GET", "/uploadposts/youtube/videos/rating", ["user", "ids"], {}], ["reportYoutubeVideoAbuse", "POST", "/uploadposts/youtube/videos/{video_id}/report-abuse", ["user", "video_id", "reason_id"], {}], ["getYoutubeActivities", "GET", "/uploadposts/youtube/activities", ["user"], {}], ["getYoutubeChannel", "GET", "/uploadposts/youtube/channel", ["user"], {}], ["updateYoutubeChannel", "PATCH", "/uploadposts/youtube/channel", ["user"], {}], ["lookupYoutubeChannel", "GET", "/uploadposts/youtube/channel/lookup", ["user"], {}], ["setYoutubeChannelBanner", "POST", "/uploadposts/youtube/channel/banner", ["user"], {}], ["listYoutubeChannelSections", "GET", "/uploadposts/youtube/channel/sections", ["user"], {}], ["createYoutubeChannelSection", "POST", "/uploadposts/youtube/channel/sections", ["user"], {}], ["updateYoutubeChannelSection", "PATCH", "/uploadposts/youtube/channel/sections/{section_id}", ["user", "section_id"], {}], ["deleteYoutubeChannelSection", "DELETE", "/uploadposts/youtube/channel/sections/{section_id}", ["user", "section_id"], {}], ["setYoutubeWatermark", "POST", "/uploadposts/youtube/channel/watermark", ["user"], {}], ["removeYoutubeWatermark", "DELETE", "/uploadposts/youtube/channel/watermark", ["user"], {}], ["listYoutubeBroadcasts", "GET", "/uploadposts/youtube/live/broadcasts", ["user"], {}], ["createYoutubeBroadcast", "POST", "/uploadposts/youtube/live/broadcasts", ["user"], {}], ["getYoutubeBroadcast", "GET", "/uploadposts/youtube/live/broadcasts/{broadcast_id}", ["user", "broadcast_id"], {}], ["updateYoutubeBroadcast", "PATCH", "/uploadposts/youtube/live/broadcasts/{broadcast_id}", ["user", "broadcast_id"], {}], ["deleteYoutubeBroadcast", "DELETE", "/uploadposts/youtube/live/broadcasts/{broadcast_id}", ["user", "broadcast_id"], {}], ["bindYoutubeBroadcast", "POST", "/uploadposts/youtube/live/broadcasts/{broadcast_id}/bind", ["user", "broadcast_id"], {}], ["transitionYoutubeBroadcast", "POST", "/uploadposts/youtube/live/broadcasts/{broadcast_id}/transition", ["user", "broadcast_id", "status"], {}], ["insertYoutubeCuepoint", "POST", "/uploadposts/youtube/live/broadcasts/{broadcast_id}/cuepoint", ["user", "broadcast_id"], {}], ["listYoutubeStreams", "GET", "/uploadposts/youtube/live/streams", ["user"], {}], ["createYoutubeStream", "POST", "/uploadposts/youtube/live/streams", ["user"], {}], ["getYoutubeStream", "GET", "/uploadposts/youtube/live/streams/{stream_id}", ["user", "stream_id"], {}], ["updateYoutubeStream", "PATCH", "/uploadposts/youtube/live/streams/{stream_id}", ["user", "stream_id"], {}], ["deleteYoutubeStream", "DELETE", "/uploadposts/youtube/live/streams/{stream_id}", ["user", "stream_id"], {}], ["getYoutubeLiveChat", "GET", "/uploadposts/youtube/live/chat", ["user"], {}], ["sendYoutubeLiveChatMessage", "POST", "/uploadposts/youtube/live/chat", ["user"], {}], ["closeYoutubeLiveChatPoll", "POST", "/uploadposts/youtube/live/chat/polls/{message_id}/close", ["user", "message_id"], {}], ["deleteYoutubeLiveChatMessage", "DELETE", "/uploadposts/youtube/live/chat/messages/{message_id}", ["user", "message_id"], {}], ["listYoutubeLiveModerators", "GET", "/uploadposts/youtube/live/moderators", ["user"], {}], ["addYoutubeLiveModerator", "POST", "/uploadposts/youtube/live/moderators", ["user"], {}], ["removeYoutubeLiveModerator", "DELETE", "/uploadposts/youtube/live/moderators/{moderator_id}", ["user", "moderator_id"], {}], ["banYoutubeLiveChatUser", "POST", "/uploadposts/youtube/live/bans", ["user", "channel_id", "type"], {}], ["unbanYoutubeLiveChatUser", "DELETE", "/uploadposts/youtube/live/bans/{ban_id}", ["user", "ban_id"], {}], ["listYoutubeSuperChats", "GET", "/uploadposts/youtube/live/super-chats", ["user"], {}]];

describe('every YouTube method hits its endpoint', () => {
  for (const [name, verb, route, args, defaults] of ROWS) {
    test(`${name} -> ${verb} ${route}`, async () => {
      const options = { maxResults: 5, confirm: true };
      for (const arg of args) options[camel(arg)] = `v_${arg}`;
      await client()[name](options);

      assert.equal(last().method.toUpperCase(), verb);
      assert.equal(urlPath(), route.replace(/\{(\w+)\}/g, (_, p) => `v_${p}`));
      const expected = { ...defaults, max_results: 5, confirm: verb === 'GET' ? 'true' : true };
      for (const arg of args) if (!route.includes(`{${arg}}`)) expected[arg] = `v_${arg}`;
      assert.deepEqual(verb === 'GET' ? last().params : JSON.parse(last().data), expected);
    });
  }
});

describe('YouTube specifics', () => {
  test('confirm is never added by the SDK', async () => {
    await client().deleteYoutubePlaylist({ user: 'p', playlistId: 'PL1' });
    assert.deepEqual(JSON.parse(last().data), { user: 'p' });
  });

  test('a caption file goes multipart', async () => {
    await client().uploadYoutubeCaption({ user: 'p', videoId: 'v1', language: 'es', file: Buffer.from('WEBVTT') });
    const fields = formFields(last().data);
    assert.equal(urlPath(), '/uploadposts/youtube/captions');
    assert.equal(fields.video_id, 'v1');
    assert.equal(fields.language, 'es');
    assert.equal(fields.file, 'WEBVTT');
  });

  test('banner, watermark and playlist images go multipart from a local file', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-'));
    const file = path.join(dir, 'banner.png');
    fs.writeFileSync(file, 'png');
    await client().setYoutubeChannelBanner({ user: 'p', image: file });
    assert.ok(last().data instanceof FormData);
    await client().replaceYoutubePlaylistImage({ user: 'p', playlistId: 'PL1', image: file, confirm: true });
    assert.equal(last().method.toUpperCase(), 'PUT');
    const parts = last().data._streams;
    const at = parts.findIndex((part) => typeof part === 'string' && part.includes('name="confirm"'));
    assert.equal(parts[at + 1], 'true');
  });

  test('message ids with slashes are encoded into the path', async () => {
    await client().deleteYoutubeLiveChatMessage({ user: 'p', messageId: 'a/b', confirm: true });
    assert.equal(urlPath(), '/uploadposts/youtube/live/chat/messages/a%2Fb');
  });

  test('editPost keeps the YouTube camelCase fields', async () => {
    await client().editPost({
      user: 'p', platform: 'youtube', postId: 'v1', privacyStatus: 'unlisted', publishAt: '2026-12-01T10:00:00Z',
      localizations: { es: { title: 'Hola' } }, localizationsRemove: ['fr'], brandPartner: 'UCxxxxxxxxxxxxxxxxxxxxxx',
    });
    assert.deepEqual(JSON.parse(last().data), {
      user: 'p', platform: 'youtube', post_id: 'v1', privacyStatus: 'unlisted', publishAt: '2026-12-01T10:00:00Z',
      localizations: { es: { title: 'Hola' } }, localizations_remove: ['fr'], brand_partner: 'UCxxxxxxxxxxxxxxxxxxxxxx',
    });
  });

  test('upload sends youtube_localizations and youtube_brand_partner', async () => {
    await client().upload('https://example.com/v.mp4', {
      user: 'p', title: 't', platforms: ['youtube'],
      youtubeLocalizations: { es: { title: 'Hola' } }, youtubeBrandPartner: 'UCxxxxxxxxxxxxxxxxxxxxxx',
    });
    const fields = formFields(last().data);
    assert.equal(fields.youtube_localizations, '{"es":{"title":"Hola"}}');
    assert.equal(fields.youtube_brand_partner, 'UCxxxxxxxxxxxxxxxxxxxxxx');
  });
});
