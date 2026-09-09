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
