import assert from 'node:assert/strict';
import test from 'node:test';
import { handleCors, validateAndParseBase64Image } from '../api/_lib.js';

function createResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    headers: new Map<string, string>(),
    setHeader(name: string, value: string) {
      this.headers.set(name.toLowerCase(), value);
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('CORS accepts a same-origin Vercel request', () => {
  const res = createResponse();
  const handled = handleCors(
    { method: 'POST', headers: { origin: 'https://thumbmaster.vercel.app', host: 'thumbmaster.vercel.app' } },
    res,
  );

  assert.equal(handled, false);
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://thumbmaster.vercel.app');
});

test('CORS rejects a foreign origin', () => {
  const res = createResponse();
  const handled = handleCors(
    { method: 'POST', headers: { origin: 'https://evil.example', host: 'thumbmaster.vercel.app' } },
    res,
  );

  assert.equal(handled, true);
  assert.equal(res.statusCode, 403);
  assert.equal(res.headers.has('access-control-allow-origin'), false);
});

test('base64 image validation accepts supported images and rejects invalid input', () => {
  assert.deepEqual(validateAndParseBase64Image('data:image/png;base64,aGVsbG8='), {
    mimeType: 'image/png',
    data: 'aGVsbG8=',
  });
  assert.equal(validateAndParseBase64Image('data:text/plain;base64,aGVsbG8='), null);
  assert.equal(validateAndParseBase64Image('not-an-image'), null);
});
