// Paid partnership / branded content (TT-988). The API maps `paid_partnership` to each
// network's native label and takes the sponsor's id for Facebook and Pinterest. These
// tests pin what the SDK sends, and that it sends nothing unless asked.
//
// No network: axios is given an adapter that records the request.

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

const VIDEO = 'https://cdn.example.com/video.mp4';
const PHOTO = 'https://cdn.example.com/photo.jpg';
const base = (platforms) => ({ user: 'my-profile', title: 'Our new sneakers', platforms });

describe('paidPartnership reaches the API as paid_partnership', () => {
  test('video upload sends true', async () => {
    await client().upload(VIDEO, { ...base(['tiktok', 'youtube']), paidPartnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('photo upload sends true', async () => {
    await client().uploadPhotos([PHOTO], { ...base(['tiktok']), paidPartnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('text upload sends true', async () => {
    await client().uploadText({ ...base(['x']), paidPartnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('false is sent as false, not dropped', async () => {
    await client().upload(VIDEO, { ...base(['tiktok']), paidPartnership: false });
    assert.equal(formFields(last().data).paid_partnership, 'false');
  });

  test('the snake_case name is accepted', async () => {
    await client().upload(VIDEO, { ...base(['tiktok']), paid_partnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('camelCase wins when both are given', async () => {
    await client().upload(VIDEO, { ...base(['tiktok']), paidPartnership: false, paid_partnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'false');
  });

  test('nothing is sent when it is not set', async () => {
    await client().upload(VIDEO, base(['tiktok', 'youtube', 'facebook', 'pinterest']));
    const fields = formFields(last().data);
    assert.equal('paid_partnership' in fields, false);
    assert.equal('facebook_sponsor_id' in fields, false);
    assert.equal('pinterest_sponsor_id' in fields, false);
  });

  test('it does not replace the network fields: both are sent when both are given', async () => {
    await client().upload(VIDEO, {
      ...base(['tiktok', 'youtube']),
      paidPartnership: true,
      brandContentToggle: false,
      youtubeHasPaidProductPlacement: true,
    });
    const fields = formFields(last().data);
    assert.equal(fields.paid_partnership, 'true');
    assert.equal(fields.brand_content_toggle, 'false'); // the API lets the network's own field win
    assert.equal(fields.hasPaidProductPlacement, 'true');
  });
});

describe('facebookSponsorId reaches the API as facebook_sponsor_id', () => {
  test('on a Page video', async () => {
    await client().upload(VIDEO, {
      ...base(['facebook']), facebookPageId: '123', facebookMediaType: 'VIDEO', facebookSponsorId: '987654321',
    });
    assert.equal(formFields(last().data).facebook_sponsor_id, '987654321');
  });

  test('on photos', async () => {
    await client().uploadPhotos([PHOTO], { ...base(['facebook']), facebookPageId: '123', facebookSponsorId: '987654321' });
    assert.equal(formFields(last().data).facebook_sponsor_id, '987654321');
  });

  test('on a text post', async () => {
    await client().uploadText({ ...base(['facebook']), facebookPageId: '123', facebookSponsorId: '987654321' });
    assert.equal(formFields(last().data).facebook_sponsor_id, '987654321');
  });

  test('a number is sent as its digits', async () => {
    await client().uploadText({ ...base(['facebook']), facebookSponsorId: 987654321 });
    assert.equal(formFields(last().data).facebook_sponsor_id, '987654321');
  });

  test('the snake_case name is accepted', async () => {
    await client().uploadText({ ...base(['facebook']), facebook_sponsor_id: '987654321' });
    assert.equal(formFields(last().data).facebook_sponsor_id, '987654321');
  });

  test('an empty value is not sent', async () => {
    await client().uploadText({ ...base(['facebook']), facebookSponsorId: '' });
    assert.equal('facebook_sponsor_id' in formFields(last().data), false);
  });

  test('only when Facebook is one of the platforms', async () => {
    await client().upload(VIDEO, { ...base(['tiktok']), facebookSponsorId: '987654321' });
    assert.equal('facebook_sponsor_id' in formFields(last().data), false);
  });
});

describe('pinterestSponsorId reaches the API as pinterest_sponsor_id', () => {
  test('on a video pin', async () => {
    await client().upload(VIDEO, { ...base(['pinterest']), pinterestBoardId: 'b1', pinterestSponsorId: '555' });
    assert.equal(formFields(last().data).pinterest_sponsor_id, '555');
  });

  test('on a photo pin', async () => {
    await client().uploadPhotos([PHOTO], { ...base(['pinterest']), pinterestBoardId: 'b1', pinterestSponsorId: 555 });
    assert.equal(formFields(last().data).pinterest_sponsor_id, '555');
  });

  test('the snake_case name is accepted', async () => {
    await client().upload(VIDEO, { ...base(['pinterest']), pinterest_sponsor_id: '555' });
    assert.equal(formFields(last().data).pinterest_sponsor_id, '555');
  });

  test('only when Pinterest is one of the platforms', async () => {
    await client().upload(VIDEO, { ...base(['youtube']), pinterestSponsorId: '555' });
    assert.equal('pinterest_sponsor_id' in formFields(last().data), false);
  });
});

describe('scheduled posts can change the fields through `fields`', () => {
  test('editScheduled forwards paid_partnership untouched', async () => {
    await client().editScheduled('job-1', { fields: { paid_partnership: true } });
    assert.deepEqual(JSON.parse(last().data).fields, { paid_partnership: true });
  });
});
