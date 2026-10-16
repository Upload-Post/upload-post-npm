// renameUser / createUser(displayName): the profile username is the `user`
// value of every API call and never changes; renaming only sets display_name.
//
// No network: axios is given an adapter that records the request.

import { test, beforeEach } from 'node:test';
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

const body = () => JSON.parse(sent[sent.length - 1].data);

test('renameUser PATCHes display_name on the profile path', async () => {
  await new UploadPost('k').renameUser('client-acme', 'Acme Corp');
  assert.equal(sent[0].method.toUpperCase(), 'PATCH');
  assert.match(sent[0].url, /\/uploadposts\/users\/client-acme$/);
  assert.deepEqual(body(), { display_name: 'Acme Corp' });
});

test('renameUser encodes the username and never sends a new one', async () => {
  await new UploadPost('k').renameUser('me@brand', 'Brand');
  assert.match(sent[0].url, /\/uploadposts\/users\/me%40brand$/);
  assert.equal('username' in body(), false);
});

test('renameUser with null or empty clears the display name', async () => {
  await new UploadPost('k').renameUser('client-acme', null);
  assert.deepEqual(body(), { display_name: null });
  await new UploadPost('k').renameUser('client-acme', '');
  assert.deepEqual(body(), { display_name: '' });
});

test('createUser forwards displayName as display_name', async () => {
  await new UploadPost('k').createUser('client-acme', { displayName: 'Acme Corp' });
  assert.deepEqual(body(), { username: 'client-acme', display_name: 'Acme Corp' });
});

test('createUser without options sends only the username', async () => {
  await new UploadPost('k').createUser('client-acme');
  assert.deepEqual(body(), { username: 'client-acme' });
});
