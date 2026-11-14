// Native commercial disclosure (TT-988). The SDK builds its form from a
// whitelist, so a field that is not listed here never reaches the API: a
// customer sending paid_partnership / facebook_sponsor_id / pinterest_sponsor_id
// through the SDK got a post without the label and no error.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UploadPost } from '../index.js';

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

// upload / uploadPhotos / uploadText hand the finished form to _request: capture it.
function client() {
  const c = new UploadPost('test-key');
  c._request = async (path, _method, form) => ({ path, fields: formFields(form) });
  return c;
}

const VIDEO = 'https://cdn.example.com/v.mp4';
const PHOTOS = ['https://cdn.example.com/a.jpg'];

describe('paidPartnership (cross-network switch)', () => {
  test('video, photo and text uploads send paid_partnership', async () => {
    const video = await client().upload(VIDEO, { user: 'p', title: 't', platforms: ['tiktok'], paidPartnership: true });
    assert.equal(video.fields.paid_partnership, 'true');

    const photo = await client().uploadPhotos(PHOTOS, { user: 'p', title: 't', platforms: ['x'], paidPartnership: true });
    assert.equal(photo.fields.paid_partnership, 'true');

    const text = await client().uploadText({ user: 'p', title: 't', platforms: ['x'], paidPartnership: true });
    assert.equal(text.fields.paid_partnership, 'true');
  });

  test('the snake_case name is accepted and false is forwarded as false', async () => {
    const snake = await client().upload(VIDEO, { user: 'p', title: 't', platforms: ['youtube'], paid_partnership: true });
    assert.equal(snake.fields.paid_partnership, 'true');

    const off = await client().upload(VIDEO, { user: 'p', title: 't', platforms: ['youtube'], paidPartnership: false });
    assert.equal(off.fields.paid_partnership, 'false');
  });

  test('without the option the field is not sent at all', async () => {
    const { fields } = await client().upload(VIDEO, { user: 'p', title: 't', platforms: ['tiktok', 'youtube', 'x'] });
    assert.equal('paid_partnership' in fields, false);
  });

  test('network-specific disclosure fields still go next to it', async () => {
    const { fields } = await client().upload(VIDEO, {
      user: 'p', title: 't', platforms: ['tiktok', 'youtube', 'x'],
      paidPartnership: true, brandContentToggle: true, youtubeHasPaidProductPlacement: true, xPaidPartnership: true,
    });
    assert.equal(fields.paid_partnership, 'true');
    assert.equal(fields.brand_content_toggle, 'true');
    assert.equal(fields.hasPaidProductPlacement, 'true');
    assert.equal(fields.x_paid_partnership, 'true');
  });

  test('youtubeHasPaidProductPlacement=false is still sent (explicit declaration)', async () => {
    const { fields } = await client().upload(VIDEO, {
      user: 'p', title: 't', platforms: ['youtube'], youtubeHasPaidProductPlacement: false,
    });
    assert.equal(fields.hasPaidProductPlacement, 'false');
  });
});

describe('sponsor ids', () => {
  test('facebookSponsorId goes on video, photo and text posts', async () => {
    const video = await client().upload(VIDEO, {
      user: 'p', title: 't', platforms: ['facebook'], facebookMediaType: 'VIDEO', facebookSponsorId: '1234567890',
    });
    assert.equal(video.fields.facebook_sponsor_id, '1234567890');

    const photo = await client().uploadPhotos(PHOTOS, {
      user: 'p', title: 't', platforms: ['facebook'], facebookSponsorId: 1234567890,
    });
    assert.equal(photo.fields.facebook_sponsor_id, '1234567890');

    const text = await client().uploadText({
      user: 'p', title: 't', platforms: ['facebook'], facebook_sponsor_id: '1234567890',
    });
    assert.equal(text.fields.facebook_sponsor_id, '1234567890');
  });

  test('pinterestSponsorId goes on video and photo pins', async () => {
    const video = await client().upload(VIDEO, {
      user: 'p', title: 't', platforms: ['pinterest'], pinterestBoardId: 'b', pinterestSponsorId: '987654321',
    });
    assert.equal(video.fields.pinterest_sponsor_id, '987654321');

    const photo = await client().uploadPhotos(PHOTOS, {
      user: 'p', title: 't', platforms: ['pinterest'], pinterestBoardId: 'b', pinterest_sponsor_id: '987654321',
    });
    assert.equal(photo.fields.pinterest_sponsor_id, '987654321');
  });

  test('a sponsor id is only sent for the platform that uses it, and never empty', async () => {
    const other = await client().upload(VIDEO, {
      user: 'p', title: 't', platforms: ['tiktok'], facebookSponsorId: '1', pinterestSponsorId: '2',
    });
    assert.equal('facebook_sponsor_id' in other.fields, false);
    assert.equal('pinterest_sponsor_id' in other.fields, false);

    const empty = await client().upload(VIDEO, {
      user: 'p', title: 't', platforms: ['facebook', 'pinterest'], facebookSponsorId: '', pinterestSponsorId: '',
    });
    assert.equal('facebook_sponsor_id' in empty.fields, false);
    assert.equal('pinterest_sponsor_id' in empty.fields, false);
  });
});
