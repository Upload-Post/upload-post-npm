// paidPartnership, facebookSponsorId and pinterestSponsorId reach the API under their form names.

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

const common = (options) => {
  const form = new FormData();
  client()._addCommonParams(form, { user: 'u', platforms: ['tiktok'], ...options });
  return formFields(form);
};

describe('paid_partnership', () => {
  test('true and false are both sent, as strings', () => {
    assert.equal(common({ paidPartnership: true }).paid_partnership, 'true');
    assert.equal(common({ paidPartnership: false }).paid_partnership, 'false');
  });

  test('the snake_case alias works and camelCase wins', () => {
    assert.equal(common({ paid_partnership: true }).paid_partnership, 'true');
    assert.equal(common({ paidPartnership: false, paid_partnership: true }).paid_partnership, 'false');
  });

  test('absent means not sent', () => {
    assert.equal('paid_partnership' in common({}), false);
  });
});

describe('Facebook sponsor id', () => {
  const fb = (options, isVideo, isText) => {
    const form = new FormData();
    client()._addFacebookParams(form, { facebookPageId: '1', ...options }, isVideo, isText);
    return formFields(form);
  };

  test('goes on video, photo and text posts', () => {
    assert.equal(fb({ facebookSponsorId: '99' }, true, false).facebook_sponsor_id, '99');
    assert.equal(fb({ facebookSponsorId: '99' }, false, false).facebook_sponsor_id, '99');
    assert.equal(fb({ facebookSponsorId: '99' }, false, true).facebook_sponsor_id, '99');
  });

  test('accepts a number, the snake_case alias, and skips empty', () => {
    assert.equal(fb({ facebookSponsorId: 99 }, false, false).facebook_sponsor_id, '99');
    assert.equal(fb({ facebook_sponsor_id: '7' }, false, false).facebook_sponsor_id, '7');
    assert.equal('facebook_sponsor_id' in fb({ facebookSponsorId: '' }, false, false), false);
    assert.equal('facebook_sponsor_id' in fb({}, false, false), false);
  });
});

describe('Pinterest sponsor id', () => {
  const pin = (options, isVideo) => {
    const form = new FormData();
    client()._addPinterestParams(form, { pinterestBoardId: 'b', ...options }, isVideo);
    return formFields(form);
  };

  test('goes on video and photo pins', () => {
    assert.equal(pin({ pinterestSponsorId: '42' }, true).pinterest_sponsor_id, '42');
    assert.equal(pin({ pinterestSponsorId: '42' }, false).pinterest_sponsor_id, '42');
  });

  test('alias, and not sent when absent', () => {
    assert.equal(pin({ pinterest_sponsor_id: '5' }, false).pinterest_sponsor_id, '5');
    assert.equal('pinterest_sponsor_id' in pin({}, false), false);
  });
});
