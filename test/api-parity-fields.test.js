// Whitelist: platform helpers only send listed fields. Unlisted options are dropped.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import FormData from 'form-data';
import { UploadPost } from '../index.js';

const client = () => new UploadPost('test-key');

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

describe('TikTok draft aliases', () => {
  test('postMode MEDIA_UPLOAD and tiktokUploadToDraft both go on photos', () => {
    const form = new FormData();
    client()._addTiktokParams(form, {
      postMode: 'MEDIA_UPLOAD',
      tiktokUploadToDraft: true,
    }, false);
    const fields = formFields(form);
    assert.equal(fields.post_mode, 'MEDIA_UPLOAD');
    assert.equal(fields.tiktok_upload_to_draft, 'true');
  });

  test('snake_case draft aliases are accepted', () => {
    const form = new FormData();
    client()._addTiktokParams(form, {
      post_mode: 'MEDIA_UPLOAD',
      tiktok_upload_to_draft: true,
      upload_to_draft: true,
    }, true);
    const fields = formFields(form);
    assert.equal(fields.post_mode, 'MEDIA_UPLOAD');
    assert.equal(fields.tiktok_upload_to_draft, 'true');
  });

  test('tiktokPostMode still maps to post_mode', () => {
    const form = new FormData();
    client()._addTiktokParams(form, { tiktokPostMode: 'DIRECT_POST' }, true);
    assert.equal(formFields(form).post_mode, 'DIRECT_POST');
  });
});

describe('new whitelist fields', () => {
  test('Instagram photo alt text', () => {
    const form = new FormData();
    client()._addInstagramParams(form, { instagramAltText: ['front', 'back'] }, false);
    assert.equal(formFields(form).instagram_alt_text, '["front","back"]');
  });

  test('Facebook photo, video and text fields', () => {
    const photo = new FormData();
    client()._addFacebookParams(photo, { facebookPageId: '1', facebookAltText: 'cat', facebookPlaceId: 'p' }, false, false);
    assert.equal(formFields(photo).facebook_alt_text, 'cat');
    assert.equal(formFields(photo).facebook_place_id, 'p');

    const video = new FormData();
    client()._addFacebookParams(video, { facebookIsAiGenerated: true, facebookCollaborators: '2' }, true, false);
    assert.equal(formFields(video).facebook_is_ai_generated, 'true');
    assert.equal(formFields(video).facebook_collaborators, '2');

    const text = new FormData();
    client()._addFacebookParams(text, { facebookCallToAction: { type: 'LEARN_MORE', link: 'https://x' } }, false, true);
    assert.equal(formFields(text).facebook_call_to_action, '{"type":"LEARN_MORE","link":"https://x"}');
  });

  test('LinkedIn targeting and alt text', () => {
    const form = new FormData();
    client()._addLinkedinParams(form, {
      linkedinAltText: 'product',
      linkedinDisableReshare: true,
      linkedinTargetGeoLocations: 'urn:li:geo:103644278',
    });
    const fields = formFields(form);
    assert.equal(fields.linkedin_alt_text, 'product');
    assert.equal(fields.linkedin_disable_reshare, 'true');
    assert.equal(fields.linkedin_target_geo_locations, 'urn:li:geo:103644278');
  });

  test('X alt text, paid partnership and article fields', () => {
    const media = new FormData();
    client()._addXParams(media, { xAltText: 'a cat', xPaidPartnership: true }, false);
    assert.equal(formFields(media).x_alt_text, 'a cat');
    assert.equal(formFields(media).x_paid_partnership, 'true');

    const text = new FormData();
    client()._addXParams(text, { xArticleTitle: 'Hi', xArticleDraft: true }, true);
    assert.equal(formFields(text).x_article_title, 'Hi');
    assert.equal(formFields(text).x_article_draft, 'true');
  });

  test('Threads, Pinterest, YouTube, GBP aliases', () => {
    const threads = new FormData();
    client()._addThreadsParams(threads, { threadsReplyControl: 'mentioned_only', threadsPollOptions: ['Yes', 'No'] });
    assert.equal(formFields(threads).threads_reply_control, 'mentioned_only');
    assert.equal(formFields(threads).threads_poll_options, '["Yes","No"]');

    const pin = new FormData();
    client()._addPinterestParams(pin, { pinterestBoardSectionId: 's', pinterestAiDisclosures: 'AI_MODIFIED' }, false);
    assert.equal(formFields(pin).pinterest_board_section_id, 's');
    assert.equal(formFields(pin).pinterest_ai_disclosures, 'AI_MODIFIED');

    const yt = new FormData();
    client()._addYoutubeParams(yt, { youtubeNotifySubscribers: false, youtubePublishAt: '2030-01-01T10:00:00Z' });
    assert.equal(formFields(yt).youtube_notify_subscribers, 'false');
    assert.equal(formFields(yt).youtube_publish_at, '2030-01-01T10:00:00Z');

    const gbp = new FormData();
    client()._addGoogleBusinessParams(gbp, { gbpLanguageCode: 'es', gbpCouponCode: 'SAVE10' });
    assert.equal(formFields(gbp).gbp_language_code, 'es');
    assert.equal(formFields(gbp).gbp_coupon_code, 'SAVE10');
  });

  test('Reddit fields are still forwarded', () => {
    const form = new FormData();
    client()._addRedditParams(form, { redditSubreddit: 'test', redditNsfw: true, redditFlairText: 'x' }, true);
    const fields = formFields(form);
    assert.equal(fields.subreddit, 'test');
    assert.equal(fields.reddit_nsfw, 'true');
    assert.equal(fields.reddit_flair_text, 'x');
  });

  test('Bluesky and Discord fields are not dropped', () => {
    const form = new FormData();
    client()._addCredentialPlatformParams(form, {
      platforms: ['bluesky', 'discord'],
      blueskyAltText: 'storefront',
      blueskyLangs: 'en',
      discordThreadName: 'launch',
    });
    const fields = formFields(form);
    assert.equal(fields.bluesky_alt_text, 'storefront');
    assert.equal(fields.bluesky_langs, 'en');
    assert.equal(fields.discord_thread_name, 'launch');
  });

  test('unlisted options are dropped', () => {
    const form = new FormData();
    client()._addFacebookParams(form, { facebookPageId: '1', notARealField: 'nope' }, false, false);
    const fields = formFields(form);
    assert.equal(fields.facebook_page_id, '1');
    assert.equal(fields.notARealField, undefined);
  });
});

// Ticket #5385: the SDK never forwarded thumbnail_url or made_with_ai for X, so
// customers had to drop to raw REST to use either.
describe('X cover and AI disclosure', () => {
  function countField(form, name) {
    const body = form.getBuffer().toString('utf8');
    return body.split(`name="${name}"`).length - 1;
  }
  function captured() {
    const c = client();
    c._request = async (_path, _method, form) => form;
    return c;
  }

  test('madeWithAi and its aliases go as made_with_ai on media posts only', () => {
    const media = new FormData();
    client()._addXParams(media, { madeWithAi: true }, false);
    assert.equal(formFields(media).made_with_ai, 'true');

    const alias = new FormData();
    client()._addXParams(alias, { isAiGenerated: true }, false);
    assert.equal(formFields(alias).made_with_ai, 'true');

    const text = new FormData();
    client()._addXParams(text, { madeWithAi: true }, true);
    assert.equal(formFields(text).made_with_ai, undefined);
  });

  test('upload() sends thumbnail_url for X', async () => {
    const form = await captured().upload('https://cdn.example.com/v.mp4', {
      user: 'p', title: 't', platforms: ['x'],
      thumbnailUrl: 'https://cdn.example.com/cover.jpg', madeWithAi: true,
    });
    const fields = formFields(form);
    assert.equal(fields.thumbnail_url, 'https://cdn.example.com/cover.jpg');
    assert.equal(fields.made_with_ai, 'true');
    assert.equal(countField(form, 'thumbnail_url'), 1);
  });

  test('upload() never duplicates thumbnail_url when Facebook or YouTube also send it', async () => {
    const fb = await captured().upload('https://cdn.example.com/v.mp4', {
      user: 'p', title: 't', platforms: ['x', 'facebook'],
      thumbnailUrl: 'https://cdn.example.com/cover.jpg',
    });
    assert.equal(countField(fb, 'thumbnail_url'), 1);

    const yt = await captured().upload('https://cdn.example.com/v.mp4', {
      user: 'p', title: 't', platforms: ['x', 'youtube'],
      youtubeThumbnailUrl: 'https://cdn.example.com/cover.jpg',
    });
    assert.equal(countField(yt, 'thumbnail_url'), 1);
    assert.equal(formFields(yt).thumbnail_url, 'https://cdn.example.com/cover.jpg');

    const none = await captured().upload('https://cdn.example.com/v.mp4', {
      user: 'p', title: 't', platforms: ['x'],
    });
    assert.equal(countField(none, 'thumbnail_url'), 0);
  });
});

describe('fields agents reported as dropped (2.17.0)', () => {
  test('Instagram trial Reels share_mode on videos only', () => {
    const video = new FormData();
    client()._addInstagramParams(video, { instagramShareMode: 'TRIAL_REELS_DONT_SHARE_TO_FOLLOWERS' }, true);
    assert.equal(formFields(video).share_mode, 'TRIAL_REELS_DONT_SHARE_TO_FOLLOWERS');

    const snake = new FormData();
    client()._addInstagramParams(snake, { share_mode: 'TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED' }, true);
    assert.equal(formFields(snake).share_mode, 'TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED');

    const photo = new FormData();
    client()._addInstagramParams(photo, { instagramShareMode: 'TRIAL_REELS_DONT_SHARE_TO_FOLLOWERS' }, false);
    assert.equal(formFields(photo).share_mode, undefined);
  });

  test('Instagram AI label goes as is_ai_generated on videos and photos', () => {
    for (const isVideo of [true, false]) {
      const form = new FormData();
      client()._addInstagramParams(form, { instagramIsAiGenerated: true }, isVideo);
      assert.equal(formFields(form).is_ai_generated, 'true');
    }
  });

  test('Facebook photo stories send facebook_media_type', () => {
    const form = new FormData();
    client()._addFacebookParams(form, { facebookMediaType: 'STORIES' }, false, false);
    assert.equal(formFields(form).facebook_media_type, 'STORIES');

    const text = new FormData();
    client()._addFacebookParams(text, { facebookMediaType: 'STORIES' }, false, true);
    assert.equal(formFields(text).facebook_media_type, undefined);
  });
});

describe('commercial disclosure fields (2.20.0)', () => {
  function countField(form, name) {
    const body = form.getBuffer().toString('utf8');
    return body.split(`name="${name}"`).length - 1;
  }
  function captured() {
    const c = client();
    c._request = async (_path, _method, form) => form;
    return c;
  }
  const video = (options) => captured().upload('https://cdn.example.com/v.mp4', { user: 'p', title: 't', ...options });
  const photos = (options) => captured().uploadPhotos(['https://cdn.example.com/a.jpg'], { user: 'p', title: 't', ...options });
  const text = (options) => captured().uploadText({ user: 'p', title: 't', ...options });

  test('paidPartnership goes as paid_partnership, once, on video, photos and text', async () => {
    for (const send of [video, photos, text]) {
      const form = await send({ platforms: ['x', 'youtube', 'tiktok'], paidPartnership: true });
      assert.equal(formFields(form).paid_partnership, 'true');
      assert.equal(countField(form, 'paid_partnership'), 1);
    }
  });

  test('paidPartnership false is sent as "false" (the API gives the network-specific field priority)', async () => {
    const form = await video({ platforms: ['tiktok'], paidPartnership: false });
    assert.equal(formFields(form).paid_partnership, 'false');
  });

  test('snake_case paid_partnership is accepted', async () => {
    const form = await video({ platforms: ['youtube'], paid_partnership: true });
    assert.equal(formFields(form).paid_partnership, 'true');
    assert.equal(countField(form, 'paid_partnership'), 1);
  });

  test('paid_partnership is not sent when unset, and does not replace the network-specific fields', async () => {
    for (const send of [video, photos, text]) {
      const form = await send({ platforms: ['x', 'youtube', 'tiktok'] });
      assert.equal(countField(form, 'paid_partnership'), 0);
    }
    const both = await video({
      platforms: ['x', 'youtube', 'tiktok'],
      paidPartnership: true,
      xPaidPartnership: false,
      youtubeHasPaidProductPlacement: false,
      brandContentToggle: false,
    });
    const fields = formFields(both);
    assert.equal(fields.paid_partnership, 'true');
    assert.equal(fields.x_paid_partnership, 'false');
    assert.equal(fields.hasPaidProductPlacement, 'false');
    assert.equal(fields.brand_content_toggle, 'false');
  });

  test('facebookSponsorId goes as facebook_sponsor_id on video, photos and text', async () => {
    for (const send of [video, photos, text]) {
      const form = await send({ platforms: ['facebook'], facebookSponsorId: '1234567890' });
      assert.equal(formFields(form).facebook_sponsor_id, '1234567890');
      assert.equal(countField(form, 'facebook_sponsor_id'), 1);
    }
    const snake = new FormData();
    client()._addFacebookParams(snake, { facebook_sponsor_id: '42' }, false, false);
    assert.equal(formFields(snake).facebook_sponsor_id, '42');
  });

  test('pinterestSponsorId goes as pinterest_sponsor_id on video and photos', async () => {
    for (const send of [video, photos]) {
      const form = await send({ platforms: ['pinterest'], pinterestSponsorId: '987654321' });
      assert.equal(formFields(form).pinterest_sponsor_id, '987654321');
      assert.equal(countField(form, 'pinterest_sponsor_id'), 1);
    }
    const snake = new FormData();
    client()._addPinterestParams(snake, { pinterest_sponsor_id: '42' }, false);
    assert.equal(formFields(snake).pinterest_sponsor_id, '42');
  });

  test('sponsor ids are not sent when unset or empty, nor for other platforms', async () => {
    const unset = await video({ platforms: ['facebook', 'pinterest'] });
    assert.equal(countField(unset, 'facebook_sponsor_id'), 0);
    assert.equal(countField(unset, 'pinterest_sponsor_id'), 0);

    const empty = await video({ platforms: ['facebook', 'pinterest'], facebookSponsorId: '', pinterestSponsorId: '' });
    assert.equal(countField(empty, 'facebook_sponsor_id'), 0);
    assert.equal(countField(empty, 'pinterest_sponsor_id'), 0);

    // Each id belongs to its own platform's params.
    const other = await video({ platforms: ['x'], facebookSponsorId: '1', pinterestSponsorId: '2' });
    assert.equal(countField(other, 'facebook_sponsor_id'), 0);
    assert.equal(countField(other, 'pinterest_sponsor_id'), 0);
  });
});
