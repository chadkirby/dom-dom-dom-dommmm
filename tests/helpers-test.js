let test = require('./tape')(module);
let {
  closest,
  collectTextNodes,
  createElement,
  createFragment,
  createTextNode,
  filterTextNodes,
  fragmentToHtml,
  parentsUntil,
  unwrap
} = require('../src/helpers');

test(`collectTextNodes collects text nodes`, (assert) => {
  let $ = createFragment(`<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`);
  assert.ok(
    Array.from(collectTextNodes($)).every((n) => n.nodeName === `#text`)
  );
  assert.deepEqual(
    Array.from(collectTextNodes($), (n) => n.textContent),
    [ '1', '2', '3', '4', '5', '6', '7', '8', '9' ]
  );

  assert.deepEqual(
    Array.from(collectTextNodes($, $.querySelector(`d`)), (n) => n.textContent),
    [ '1', '2', '3' ],
    `can specify endNode`
  );

  assert.deepEqual(
    Array.from(collectTextNodes($, $.querySelector(`foo`)), (n) => n.textContent),
    [ '1', '2', '3', '4', '5', '6', '7', '8', '9' ],
    `non-existent endNode`
  );
});

test(`createElement creates element`, (assert) => {
  assert.equal(
    createElement(`<span />`).outerHTML,
    `<span></span>`
  );

  assert.equal(
    createElement(`<span />`).nodeName,
    `SPAN`
  );

  assert.equal(
    createElement(`<span foo='bar'/>`).outerHTML,
    `<span foo="bar"></span>`
  );

  assert.equal(
    createElement(` <span foo='bar'></span> `).outerHTML,
    `<span foo="bar"></span>`,
    `tolerates extra whitespace`
  );

  assert.equal(
    createElement(`foo`),
    null
  );

  assert.equal(
    createElement(`foo <span />`).outerHTML,
    `<span></span>`,
    `first element is returned`
  );

});

test(`createTextNode creates text node`, (assert) => {
  assert.equal(
    createTextNode(`<span />`).textContent,
    `<span />`
  );

  assert.equal(
    createTextNode(`<span />`).nodeName,
    `#text`
  );
});

test(`fragmentToHtml converts fragment to html`, (assert) => {
  let html = `<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`;
  assert.equal(
    fragmentToHtml(createFragment(html)),
    html
  );

  html = ` foo<a>bar</a>baz `;
  assert.equal(
    fragmentToHtml(createFragment(html)),
    html
  );

});

test(`collectTextNodes collects text nodes`, (assert) => {
  let $ = createFragment(`<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`);
  let $f = $.querySelector(`f`);
  assert.deepEqual(
    Array.from(parentsUntil($f, `b`), (n) => n.nodeName),
    [ `E`, `D`, `C` ]
  );

  assert.deepEqual(
    Array.from(parentsUntil($f, $.querySelector(`a`)), (n) => n.nodeName),
    [ `E`, `D`, `C`, `B` ]
  );
  assert.deepEqual(
    Array.from(parentsUntil($f), (n) => n.nodeName),
    [ `E`, `D`, `C`, `B`, `A`, `H3` ]
  );
});

test(`unwrap unwraps`, (assert) => {
  let $ = createFragment(`<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`);

  unwrap($.querySelector('f'));
  assert.deepEqual(
    fragmentToHtml($),
    `<h3><a>1<b>2<c>3<d>4<e>567</e>8</d>9</c></b></a></h3>`
  );

  unwrap($.querySelector('d'));
  assert.deepEqual(
    fragmentToHtml($),
    `<h3><a>1<b>2<c>34<e>567</e>89</c></b></a></h3>`
  );

  unwrap($.querySelector('b'));
  assert.deepEqual(
    fragmentToHtml($),
    `<h3><a>12<c>34<e>567</e>89</c></a></h3>`
  );

  unwrap($.querySelector('a'));
  assert.deepEqual(
    fragmentToHtml($),
    `<h3>12<c>34<e>567</e>89</c></h3>`
  );

});

test(`closest finds the closest`, (assert) => {
  let $ = createFragment(`<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`);
  let $f = $.querySelector('f');

  assert.deepEqual(
    closest($f, `c`).nodeName,
    `C`
  );

  assert.ok(
    closest($f, `f`).isSameNode($f)
  );

  assert.equal(
    closest($f, `h1`),
    null
  );

  let $a = $.querySelector(`a`);
  assert.ok(
    closest($a.firstChild, `a`).isSameNode($a),
    `works with text-node input`
  );

  assert.equal(
    closest($.querySelector('foo')),
    null,
    `returns null on falsy input`
  );

});

test(`filterTextNodes filters text nodes`, (assert) => {
  let $p = createElement(`<p>abc<b>123<i>4<u>5</u>6</i></b></p>`);
  assert.deepEqual(
    Array.from(filterTextNodes($p, (n) => !closest(n, `i`)), (n) => n.textContent),
    [ `abc`, `123` ],
    `italic nodes are filtered out`
  );

  assert.deepEqual(
    Array.from(filterTextNodes($p, (n) => closest(n, `b`)), (n) => n.textContent),
    [ `123`, `4`, `5`, `6` ],
    `bold nodes are filtered in`
  );

  assert.end();
});
