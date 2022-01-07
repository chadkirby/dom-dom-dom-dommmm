import getTest from './tape.js';
const test = getTest({ filename: import.meta.url });

import {
  spliceChars,
  createElement,
  createFragment,
  fragmentToHtml,
} from '../dist/index.js';

test('spliceChars exports something', function (assert) {
  assert.equal(typeof spliceChars, `function`, `spliceChars function exists`);
  assert.end();
});

test('spliceChars splices chars', function (assert) {
  let $ = createFragment('<h1>123456789</h1>');
  spliceChars($.querySelector('h1'), 2, 0);
  assert.equal(fragmentToHtml($), `<h1>123456789</h1>`);
  spliceChars($.querySelector('h1'), 1, 4, 'foo', 'bar');
  assert.equal(fragmentToHtml($), `<h1>1foobar6789</h1>`);

  $ = createFragment(
    `<h2><s>12</s><u><sub><i>3<sup>4</sup></i></sub>56</u>789</h2>`
  );
  spliceChars($.querySelector('h2'), 0, 4, createElement(`<span>hi</span>`));
  assert.equal(
    fragmentToHtml($),
    `<h2><s><span>hi</span></s><u>56</u>789</h2>`
  );

  $ = createFragment(
    `<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`
  );
  spliceChars($.querySelector('h3'), 1, 4, createElement(`<span>hi</span>`));
  assert.equal(
    fragmentToHtml($),
    `<h3><a>1<b><span>hi</span><c><d><e><f>6</f>7</e>8</d>9</c></b></a></h3>`
  );

  $ = createFragment(`<h4>123456789</h4>`);
  spliceChars($.querySelector('h4'), 2, 0, 'inserted at two');
  assert.equal(fragmentToHtml($), `<h4>12inserted at two3456789</h4>`);
  assert.end();
});
