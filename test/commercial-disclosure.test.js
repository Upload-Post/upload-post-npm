// Paid partnership / branded content fields: sent only when the caller sets them.

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

describe('paid_partnership', () => {
  test('paidPartnership and the snake_case name both send paid_partnership', () => {
    for (const options of [{ paidPartnership: true }, { paid_partnership: true }]) {
      const form = new FormData();
      client()._addCommonParams(form, { user: 'u', platforms: ['tiktok'], ...options });
      assert.equal(formFields(form).paid_partnership, 'true');
    }
  });

  test('false is sent as false, not dropped', () => {
    const form = new FormData();
    client()._addCommonParams(form, { user: 'u', platforms: ['x'], paidPartnership: false });
    assert.equal(formFields(form).paid_partnership, 'false');
  });

  test('nothing is sent when the option is absent', () => {
    const form = new FormData();
    client()._addCommonParams(form, { user: 'u', platforms: ['tiktok', 'youtube'] });
    assert.equal('paid_partnership' in formFields(form), false);
  });
});

describe('sponsor ids', () => {
  test('facebookSponsorId goes on video, photo and text posts', () => {
    for (const [isVideo, isText] of [[true, false], [false, false], [false, true]]) {
      const form = new FormData();
      client()._addFacebookParams(form, { facebookPageId: '1', facebookSponsorId: '1234567890' }, isVideo, isText);
      assert.equal(formFields(form).facebook_sponsor_id, '1234567890');
    }
  });

  test('a numeric sponsor id is sent as a string', () => {
    const form = new FormData();
    client()._addFacebookParams(form, { facebook_sponsor_id: 42 }, true);
    assert.equal(formFields(form).facebook_sponsor_id, '42');
  });

  test('pinterestSponsorId goes on video and photo Pins', () => {
    for (const isVideo of [true, false]) {
      const form = new FormData();
      client()._addPinterestParams(form, { pinterestBoardId: 'b', pinterestSponsorId: '987' }, isVideo);
      assert.equal(formFields(form).pinterest_sponsor_id, '987');
    }
  });

  test('no sponsor id fields without the options', () => {
    const fb = new FormData();
    client()._addFacebookParams(fb, { facebookPageId: '1' }, true);
    const pin = new FormData();
    client()._addPinterestParams(pin, { pinterestBoardId: 'b' }, true);
    assert.equal('facebook_sponsor_id' in formFields(fb), false);
    assert.equal('pinterest_sponsor_id' in formFields(pin), false);
  });
});

describe('native per-network fields keep working', () => {
  test('TikTok brand toggles, YouTube placement and X partnership', () => {
    const tiktok = new FormData();
    client()._addTiktokParams(tiktok, { brandContentToggle: true, brandOrganicToggle: false }, true);
    assert.equal(formFields(tiktok).brand_content_toggle, 'true');
    assert.equal(formFields(tiktok).brand_organic_toggle, 'false');

    const x = new FormData();
    client()._addXParams(x, { xPaidPartnership: true }, false);
    assert.equal(formFields(x).x_paid_partnership, 'true');
  });
});
