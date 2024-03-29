import getTest from './tape.js';
const test = getTest({ filename: import.meta.url });

import {
  attr,
  closest,
  collectTextNodes,
  createElement,
  createFragment,
  createTextNode,
  filterTextNodes,
  fragmentToHtml,
  lookupNamespaceURI,
  parentsUntil,
  parse,
  previousSiblings,
  nextSiblings,
  splitSearch,
  unwrap,
} from '../dist/helpers.js';

import { el } from '../dist/tag-functions.js';

test(`createFragment creates fragment`, (assert) => {
  let $ = createFragment(`Hello<span> </span>World`);
  assert.equal($.nodeName, `#document-fragment`);
  assert.equal($.ownerDocument.contentType, `text/html`);
  assert.equal(fragmentToHtml($), `Hello<span> </span>World`);

  let xmlDoc = parse(`<root />`, `text/xml`);
  $ = createFragment(`Hello<span> </span>World`, xmlDoc);
  assert.equal($.nodeName, `#document-fragment`);
  assert.equal($.ownerDocument.contentType, `text/xml`);
  assert.equal(fragmentToHtml($), `Hello<span> </span>World`);
});

test(`collectTextNodes collects text nodes`, (assert) => {
  let $ = createFragment(
    `<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`
  );
  assert.ok(
    Array.from(collectTextNodes($)).every((n) => n.nodeName === `#text`)
  );
  assert.deepEqual(
    Array.from(collectTextNodes($), (n) => n.textContent),
    ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  );

  assert.deepEqual(
    Array.from(collectTextNodes($, $.querySelector(`d`)), (n) => n.textContent),
    ['1', '2', '3'],
    `can specify endNode`
  );

  assert.deepEqual(
    Array.from(
      collectTextNodes($, $.querySelector(`foo`)),
      (n) => n.textContent
    ),
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    `non-existent endNode`
  );
});

test(`createElement creates element`, (assert) => {
  assert.equal(createElement(`<span />`).outerHTML, `<span></span>`);

  assert.equal(createElement(`<span />`).nodeName, `SPAN`);

  assert.equal(
    createElement(`<span foo='bar'/>`).outerHTML,
    `<span foo="bar"></span>`
  );

  assert.equal(
    createElement(` <span foo='bar'></span> `).outerHTML,
    `<span foo="bar"></span>`,
    `tolerates extra whitespace`
  );

  assert.equal(createElement(`foo`), null);

  assert.equal(
    createElement(`foo <span />`).outerHTML,
    `<span></span>`,
    `first element is returned`
  );
});

test(`createTextNode creates text node`, (assert) => {
  assert.equal(createTextNode(`<span />`).textContent, `<span />`);

  assert.equal(createTextNode(`<span />`).nodeName, `#text`);
});

test(`fragmentToHtml converts fragment to html`, (assert) => {
  let html = `<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`;
  assert.equal(fragmentToHtml(createFragment(html)), html);

  html = ` foo<a>bar</a>baz `;
  assert.equal(fragmentToHtml(createFragment(html)), html);
});

test(`collectTextNodes collects text nodes`, (assert) => {
  let $ = createFragment(
    `<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`
  );
  let $f = $.querySelector(`f`);
  assert.deepEqual(
    Array.from(parentsUntil($f, `b`), (n) => n.nodeName),
    [`E`, `D`, `C`]
  );
  assert.deepEqual(
    Array.from(parentsUntil($f.firstChild, `b`), (n) => n.nodeName),
    ['F', `E`, `D`, `C`]
  );
  assert.deepEqual(
    Array.from(parentsUntil($f, $.querySelector(`a`)), (n) => n.nodeName),
    [`E`, `D`, `C`, `B`]
  );
  assert.deepEqual(
    Array.from(parentsUntil($f), (n) => n.nodeName),
    [`E`, `D`, `C`, `B`, `A`, `H3`]
  );
});

test(`unwrap unwraps`, (assert) => {
  let $ = createFragment(
    `<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`
  );

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
  assert.deepEqual(fragmentToHtml($), `<h3>12<c>34<e>567</e>89</c></h3>`);
});

test(`closest finds the closest`, (assert) => {
  let $ = createFragment(
    `<h3><a>1<b>2<c>3<d>4<e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`
  );
  let $f = $.querySelector('f');

  assert.deepEqual(closest($f, `c`).nodeName, `C`);

  assert.ok(closest($f, `f`) === $f);

  assert.equal(closest($f, `h1`), null);

  let $a = $.querySelector(`a`);
  assert.ok(closest($a.firstChild, `a`) === $a, `works with text-node input`);

  assert.equal(
    closest($.querySelector('foo')),
    null,
    `returns null on falsy input`
  );
});

test(`filterTextNodes filters text nodes`, (assert) => {
  let $p = createElement(`<p>abc<b>123<i>4<u>5</u>6</i></b></p>`);
  assert.deepEqual(
    Array.from(
      filterTextNodes($p, (n) => !closest(n, `i`)),
      (n) => n.textContent
    ),
    [`abc`, `123`],
    `italic nodes are filtered out`
  );

  assert.deepEqual(
    Array.from(
      filterTextNodes($p, (n) => closest(n, `b`)),
      (n) => n.textContent
    ),
    [`123`, `4`, `5`, `6`],
    `bold nodes are filtered in`
  );

  // remove nodes 123 and 6 as we iterate
  for (const node of filterTextNodes(
    $p,
    (n) => parseInt(n.textContent, 10) > 5
  )) {
    node.remove();
  }
  assert.equal(
    $p.outerHTML,
    `<p>abc<b><i>4<u>5</u></i></b></p>`,
    `can modify dom during loop`
  );

  assert.end();
});

test(`attr returns attributes as a POJO`, (assert) => {
  assert.deepEqual(
    { ...attr(el`<span id='123' foo='bar' baz-bat='bot' />`) },
    {
      foo: 'bar',
      'baz-bat': 'bot',
      id: '123',
    }
  );

  assert.deepEqual(
    attr(el``),
    Object.create(null),
    `non-existent element returns empty object`
  );
  assert.deepEqual(
    attr(el`<p>foo</p>`),
    Object.create(null),
    `no attributes returns empty object`
  );
});

test(`previousSiblings iterates over previous siblings`, (assert) => {
  let $ = el`<h3>
    <a>1</a>
    2<c>3</c>
    <d>4<e>5</e></d>
    <f>6</f>
  </h3>`;
  assert.deepEqual(
    Array.from(previousSiblings($.querySelector('f')), (n) => n.textContent),
    ['45', '3', '2', '1']
  );

  assert.deepEqual(
    Array.from(previousSiblings($.querySelector('e')), (n) => n.textContent),
    ['4']
  );

  assert.deepEqual(
    Array.from(previousSiblings($.querySelector('a')), (n) => n.textContent),
    []
  );

  assert.deepEqual(
    Array.from(
      previousSiblings($.querySelector('foobar')),
      (n) => n.textContent
    ),
    []
  );
});

test(`nextSiblings iterates over next siblings`, (assert) => {
  let $ = el`<h3>
    <a>1</a>
    2<c>3</c>
    <d>4<e>5</e></d>
    <f>6</f>
  </h3>`;
  assert.deepEqual(
    Array.from(nextSiblings($.querySelector('a')), (n) => n.textContent),
    ['2', '3', '45', '6']
  );

  assert.deepEqual(
    Array.from(
      nextSiblings($.querySelector('d').firstChild),
      (n) => n.textContent
    ),
    ['5']
  );

  assert.deepEqual(
    Array.from(nextSiblings($.querySelector('f')), (n) => n.textContent),
    []
  );

  assert.deepEqual(
    Array.from(nextSiblings($.querySelector('foobar')), (n) => n.textContent),
    []
  );
});

test(`splitSearch splits & searches`, (assert) => {
  function makeFragment() {
    return createFragment(
      `<h3><a>1<b> 2<c>3 <d> 4 <e>5<f>6</f>7</e>8</d>9</c></b></a></h3>`
    );
  }

  let $ = makeFragment();
  assert.deepEqual(splitSearch($.querySelector('h3'), /1/), [
    $.querySelector('a').childNodes[0],
  ]);
  $ = makeFragment();
  assert.deepEqual(splitSearch($.querySelector('h3'), /2/), [
    $.querySelector('b').childNodes[1],
  ]);
  $ = makeFragment();
  assert.deepEqual(splitSearch($.querySelector('h3'), /3/), [
    $.querySelector('c').childNodes[0],
  ]);
  assert.deepEqual(
    [...$.querySelector('c').childNodes].map((x) => x.textContent),
    ['3', ' ', ' 4 5678', '9'],
    'first text node is split in two'
  );
  $ = makeFragment();
  assert.deepEqual(splitSearch($.querySelector('h3'), /567/), [
    ...collectTextNodes($.querySelector('e')),
  ]);

  $ = makeFragment();
  assert.deepEqual(
    splitSearch($.querySelector('h3'), /\d{2}/g).map((res) =>
      res.map((x) => x.textContent)
    ),
    [
      ['2', '3'],
      ['5', '6'],
      ['7', '8'],
    ]
  );

  $ = makeFragment();
  assert.deepEqual(
    splitSearch($.querySelector('h3'), /[1-3 ]/g).map((res) =>
      res.map((x) => x.textContent)
    ),
    [['1'], [' '], ['2'], ['3'], [' '], [' '], [' ']]
  );

  assert.deepEqual(
    splitSearch(
      createFragment(`<h3>12345</h3>`).querySelector('h3'),
      /.{1,2}/g
    ).map(([x]) => x.textContent),
    ['12', '34', '5']
  );

  assert.deepEqual(
    splitSearch(createFragment(`<h3>12345</h3>`).querySelector('h3'), /6/g),
    []
  );
});

test(`lookupNamespaceURI knows well known URIs`, (assert) => {
  assert.equal(
    lookupNamespaceURI('xml'),
    'http://www.w3.org/XML/1998/namespace'
  );
  assert.equal(lookupNamespaceURI('xmlns'), 'http://www.w3.org/2000/xmlns/');
});

test(`fragmentToHtml`, (assert) => {
  let $paragraph = createFragment(`<p>foo<b></b>baz</p>`);
  // put html-looking text in the <b> tag
  $paragraph.querySelector('b').textContent = '<b>bar</b>';
  assert.equal(
    fragmentToHtml($paragraph),
    '<p>foo<b>&lt;b&gt;bar&lt;/b&gt;</b>baz</p>',
    'angle brackets are escaped'
  );
});
