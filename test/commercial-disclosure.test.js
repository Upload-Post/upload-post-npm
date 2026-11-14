// Paid partnership / branded content fields (TT-988). The API gained a cross-network
// `paid_partnership` switch and two sponsor ids; the SDK must carry them and must
// stay silent when they are not asked for, so existing callers send exactly what
// they sent before.
//
// No network: axios is given an adapter that records the request, so every
// assertion is about what the SDK would have sent.

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

const NEW_FIELDS = ['paid_partnership', 'facebook_sponsor_id', 'pinterest_sponsor_id'];

describe('paidPartnership', () => {
  test('uploadText sends paid_partnership', async () => {
    await client().uploadText({ user: 'p', title: 'Sponsored', platforms: ['x'], paidPartnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('uploadPhotos sends paid_partnership', async () => {
    await client().uploadPhotos(['https://example.com/a.jpg'], {
      user: 'p', title: 'Sponsored', platforms: ['tiktok'], paidPartnership: true,
    });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('upload (video) sends paid_partnership', async () => {
    await client().upload('https://example.com/v.mp4', {
      user: 'p', title: 'Sponsored', platforms: ['youtube'], paidPartnership: true,
    });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('false is sent too (an explicit "no" is not "not asked")', () => {
    const form = new FormData();
    client()._addCommonParams(form, { user: 'p', title: 't', platforms: ['x'], paidPartnership: false });
    assert.equal(formFields(form).paid_partnership, 'false');
  });

  test('the API name is accepted as an alias', () => {
    const form = new FormData();
    client()._addCommonParams(form, { user: 'p', title: 't', platforms: ['x'], paid_partnership: true });
    assert.equal(formFields(form).paid_partnership, 'true');
  });

  test('it does not replace the network-specific options', () => {
    const form = new FormData();
    const c = client();
    const options = {
      user: 'p', title: 't', platforms: ['tiktok', 'youtube', 'x'],
      paidPartnership: true, brandContentToggle: false, youtubeHasPaidProductPlacement: false, xPaidPartnership: false,
    };
    c._addCommonParams(form, options);
    c._addTiktokParams(form, options, true);
    c._addXParams(form, options, false);
    const fields = formFields(form);
    assert.equal(fields.paid_partnership, 'true');
    assert.equal(fields.brand_content_toggle, 'false');
    assert.equal(fields.x_paid_partnership, 'false');
  });
});

describe('sponsor ids', () => {
  test('Facebook sponsor id goes on video, photo and text posts', () => {
    for (const [isVideo, isText] of [[true, false], [false, false], [false, true]]) {
      const form = new FormData();
      client()._addFacebookParams(form, { facebookPageId: '1', facebookSponsorId: '1234567890' }, isVideo, isText);
      assert.equal(formFields(form).facebook_sponsor_id, '1234567890');
    }
  });

  test('Pinterest sponsor id goes on video and photo pins', () => {
    for (const isVideo of [true, false]) {
      const form = new FormData();
      client()._addPinterestParams(form, { pinterestBoardId: 'b', pinterestSponsorId: '987654321' }, isVideo);
      assert.equal(formFields(form).pinterest_sponsor_id, '987654321');
    }
  });

  test('snake_case names are accepted', () => {
    const fb = new FormData();
    client()._addFacebookParams(fb, { facebook_sponsor_id: '11' }, false, true);
    assert.equal(formFields(fb).facebook_sponsor_id, '11');
    const pin = new FormData();
    client()._addPinterestParams(pin, { pinterest_sponsor_id: '22' }, false);
    assert.equal(formFields(pin).pinterest_sponsor_id, '22');
  });
});

describe('requests that do not ask for it are unchanged', () => {
  test('no new field appears on an upload that never sets them', async () => {
    await client().uploadText({ user: 'p', title: 'Plain', platforms: ['x', 'facebook'], facebookPageId: '1' });
    const fields = formFields(last().data);
    for (const name of NEW_FIELDS) assert.equal(fields[name], undefined, name);
  });

  test('empty sponsor ids are not sent', () => {
    const fb = new FormData();
    client()._addFacebookParams(fb, { facebookPageId: '1', facebookSponsorId: '' }, false, true);
    assert.equal(formFields(fb).facebook_sponsor_id, undefined);
    const pin = new FormData();
    client()._addPinterestParams(pin, { pinterestBoardId: 'b', pinterestSponsorId: '' }, false);
    assert.equal(formFields(pin).pinterest_sponsor_id, undefined);
  });
});
