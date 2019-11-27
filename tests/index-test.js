const test = require('./tape')(module);
const { document, window } = require('../src/index');

test(`global things exists`, (assert) => {
  assert.ok(document, `document exists`);
  assert.ok(window, `window exists`);
  assert.ok(window.DOMParser, `window.DOMParser exists`);
  assert.ok(window.XMLSerializer, `window.XMLSerializer exists`);
  assert.ok(document.implementation, `document.implementation exists`);
});

