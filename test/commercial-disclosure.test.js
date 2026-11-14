// Native commercial disclosure (TT-988): the SDK sends the cross-network
// `paid_partnership` switch and the Facebook / Pinterest sponsor ids.
//
// No network: axios is given an adapter that records the request, so every
// assertion is about what the SDK would have sent.

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

const text = { user: 'my-profile', title: 'Sponsored', platforms: ['facebook', 'x'] };

describe('paidPartnership', () => {
  test('uploadText sends paid_partnership=true', async () => {
    await client().uploadText({ ...text, paidPartnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('false is sent too, so a caller can say "no" explicitly', async () => {
    await client().uploadText({ ...text, paidPartnership: false });
    assert.equal(formFields(last().data).paid_partnership, 'false');
  });

  test('snake_case spelling is accepted', async () => {
    await client().uploadText({ ...text, paid_partnership: true });
    assert.equal(formFields(last().data).paid_partnership, 'true');
  });

  test('left out when not asked: requests without it are unchanged', async () => {
    await client().uploadText(text);
    assert.equal('paid_partnership' in formFields(last().data), false);
  });
});

/** Minimal stand-in for FormData that remembers what was appended. */
class RecordingForm {
  constructor() { this.fields = []; }
  append(key, value) { this.fields.push([key, value]); }
  values(key) { return this.fields.filter(([k]) => k === key).map(([, v]) => v); }
}

describe('sponsor ids', () => {
  test('facebookSponsorId goes on text posts', async () => {
    await client().uploadText({ ...text, facebookSponsorId: '1234567890' });
    assert.equal(formFields(last().data).facebook_sponsor_id, '1234567890');
  });

  test('facebookSponsorId goes on video and photo posts', () => {
    for (const isVideo of [true, false]) {
      const form = new RecordingForm();
      client()._addFacebookParams(form, { facebookSponsorId: '42' }, isVideo);
      assert.deepEqual(form.values('facebook_sponsor_id'), ['42']);
    }
  });

  test('pinterestSponsorId goes on video and photo pins', () => {
    for (const isVideo of [true, false]) {
      const form = new RecordingForm();
      client()._addPinterestParams(form, { pinterestSponsorId: '99' }, isVideo);
      assert.deepEqual(form.values('pinterest_sponsor_id'), ['99']);
    }
  });

  test('camelCase wins over snake_case when both are given', () => {
    const form = new RecordingForm();
    client()._addPinterestParams(form, { pinterestSponsorId: '99', pinterest_sponsor_id: '1' }, false);
    assert.deepEqual(form.values('pinterest_sponsor_id'), ['99']);
  });

  test('a number is sent as its digits', () => {
    const form = new RecordingForm();
    client()._addFacebookParams(form, { facebook_sponsor_id: 7 }, false);
    assert.deepEqual(form.values('facebook_sponsor_id'), ['7']);
  });

  test('left out when not given', () => {
    const form = new RecordingForm();
    client()._addFacebookParams(form, { facebookPageId: '1' }, false);
    client()._addPinterestParams(form, { pinterestBoardId: 'b' }, false);
    assert.equal(form.fields.some(([k]) => k.endsWith('_sponsor_id')), false);
  });
});
