// Paid partnership / branded content (TT-988): `paidPartnership`, `facebookSponsorId`
// and `pinterestSponsorId` reach the API as `paid_partnership`, `facebook_sponsor_id`
// and `pinterest_sponsor_id`, and nothing is sent when the caller did not ask.
//
// No network: axios is given an adapter that records the request.

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

const text = { user: 'my-profile', title: 'Sponsored post', platforms: ['x', 'facebook'], facebookPageId: '123' };

describe('paidPartnership', () => {
  test('uploadText sends paid_partnership=true', async () => {
    await client().uploadText({ ...text, paidPartnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('false is sent as false, not dropped (it must be able to switch the label off)', async () => {
    await client().uploadText({ ...text, paidPartnership: false });
    assert.equal(formFields(last().data).paid_partnership, 'false');
  });

  test('the snake_case name is accepted', async () => {
    await client().uploadText({ ...text, paid_partnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('uploadPhotos sends it', async () => {
    await client().uploadPhotos(['https://example.com/a.jpg'], {
      user: 'my-profile', title: 'Sponsored', platforms: ['tiktok'], paidPartnership: true,
    });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('uploadVideo sends it', async () => {
    await client().upload('https://example.com/v.mp4', {
      user: 'my-profile', title: 'Sponsored', platforms: ['tiktok', 'youtube'], paidPartnership: true,
    });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('nothing is sent when the caller did not ask', async () => {
    await client().uploadText({ ...text });
    const fields = formFields(last().data);
    for (const key of ['paid_partnership', 'facebook_sponsor_id', 'pinterest_sponsor_id']) {
      assert.equal(key in fields, false, `${key} must not be sent`);
    }
  });
});

describe('sponsor ids', () => {
  test('facebookSponsorId goes on text, photo and video posts', async () => {
    await client().uploadText({ ...text, facebookSponsorId: '1122334455' });
    assert.equal(formFields(last().data).facebook_sponsor_id, '1122334455');

    await client().uploadPhotos(['https://example.com/a.jpg'], {
      user: 'my-profile', title: 'Sponsored', platforms: ['facebook'], facebookPageId: '123',
      facebookSponsorId: '1122334455',
    });
    assert.equal(formFields(last().data).facebook_sponsor_id, '1122334455');

    await client().upload('https://example.com/v.mp4', {
      user: 'my-profile', title: 'Sponsored', platforms: ['facebook'], facebookPageId: '123',
      facebookMediaType: 'VIDEO', facebookSponsorId: '1122334455',
    });
    assert.equal(formFields(last().data).facebook_sponsor_id, '1122334455');
  });

  test('the snake_case facebook name is accepted', () => {
    const form = new FormData();
    client()._addFacebookParams(form, { facebook_sponsor_id: '42' }, true);
    assert.equal(formFields(form).facebook_sponsor_id, '42');
  });

  test('pinterestSponsorId goes on pins', () => {
    const video = new FormData();
    client()._addPinterestParams(video, { pinterestBoardId: 'b1', pinterestSponsorId: '99' }, true);
    assert.equal(formFields(video).pinterest_sponsor_id, '99');

    const photo = new FormData();
    client()._addPinterestParams(photo, { pinterest_sponsor_id: '99' }, false);
    assert.equal(formFields(photo).pinterest_sponsor_id, '99');
  });

  test('an empty sponsor id is not sent', () => {
    const form = new FormData();
    client()._addFacebookParams(form, { facebookSponsorId: '' }, true);
    client()._addPinterestParams(form, { pinterestSponsorId: '' }, true);
    const fields = formFields(form);
    assert.equal('facebook_sponsor_id' in fields, false);
    assert.equal('pinterest_sponsor_id' in fields, false);
  });
});
