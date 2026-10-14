import { test } from './test-helper.js';

test(`global things exists`, (assert) => {
  const { document, window } = globalThis as unknown as {
    document: Document;
    window: Window & {
      DOMParser: typeof DOMParser;
      XMLSerializer: typeof XMLSerializer;
    };
  };
  assert.ok(document, `document exists`);
  assert.ok(window, `window exists`);
  assert.ok(window.DOMParser, `window.DOMParser exists`);
  assert.ok(window.XMLSerializer, `window.XMLSerializer exists`);
  assert.ok(document.implementation, `document.implementation exists`);
});
