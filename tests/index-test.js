import getTest from './tape.js';
const test = getTest({ filename: import.meta.url });

test(`global things exists`, (assert) => {
  const { document, window } = globalThis;
  assert.ok(document, `document exists`);
  assert.ok(window, `window exists`);
  assert.ok(window.DOMParser, `window.DOMParser exists`);
  assert.ok(window.XMLSerializer, `window.XMLSerializer exists`);
  assert.ok(document.implementation, `document.implementation exists`);
});
