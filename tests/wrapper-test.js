const test = require('./tape')(module);
const { $, el } = require('../src/index');

test(`$ wraps an element`, (assert) => {
  let $x = $(el`<span>foo</span>`);
  assert.ok($x, `$x exists`);
  assert.equal($x.length, 1, `$x has a length`);
  let span = $x[0];
  assert.equal(
    span.outerHTML,
    `<span>foo</span>`
  );
  assert.equal(
    $x.filter(`span`)[0],
    span,
    `can filter element by selector`
  );
  assert.equal($x.html(), `foo`, `html function exists & returns innerHTML`);
  assert.equal($x.html(`bar`), `bar`, `html function sets innerHTML`);

  assert.ok(
    $x.first().is(span)
  );
});

test(`$ wraps an html string`, (assert) => {
  let $x = $(`<span>foo</span>`);
  assert.ok($x, `$x exists`);
  assert.equal($x.length, 1, `$x has a length`);
  let span = $x[0];
  assert.equal(
    span.outerHTML,
    `<span>foo</span>`
  );
  assert.deepEqual(
    $x.filter(`span`),
    [ span ],
    `can filter element by selector`
  );
  assert.equal($x.html(), `foo`, `html function exists & returns innerHTML`);
  assert.equal($x.html(`bar`), `bar`, `html function sets innerHTML`);
});

test(`$.findOne`, (assert) => {
  let $x = $(`<span><a>foo</a><a>bar<c /></a></span>`);
  assert.equal(
    $x.findOne(`a`).text(),
    `foo`
  );
  assert.equal(
    $x.findOne(`b`).length,
    0
  );

  assert.equal(
    $x.find(`a`).length,
    2
  );
  assert.equal(
    $x.find(`a`).filter((a) => a.querySelector(`c`)).length,
    1
  );
  assert.equal(
    $x.find(`a`).filter((a) => a.querySelector(`c`)).html(),
    `bar<c></c>`
  );
});

test(`$.attr`, (assert) => {
  let $x = $(`<span id='2' foo='bar' />`);
  assert.deepEqual(
    $x.attr(),
    { id: '2', foo: 'bar' }
  );
  assert.equal(
    $x.attr('id'),
    '2'
  );
  assert.equal(
    $x.attr('id', 3),
    '3'
  );
  assert.equal(
    $x[0].outerHTML,
    `<span id="3" foo="bar"></span>`
  );
});

test(`$.attribs`, (assert) => {
  let $x = $(`<span id='2' foo='bar' />`);
  let { attribs } = $x;
  assert.deepEqual(
    attribs,
    { id: '2', foo: 'bar' }
  );
  attribs.id = 3;
  Object.assign(attribs, { foo: 'BAR', baz: 'bat' });
  assert.equal(
    $x[0].outerHTML,
    `<span id="3" foo="BAR" baz="bat"></span>`
  );
});

test(`$.index`, (assert) => {
  let $x = $(`<div />`);
  assert.deepEqual(
    $x.index($x[0]),
    0
  );
  assert.deepEqual(
    $x.index($x),
    0
  );
});

test(`$.find.filter`, (assert) => {
  let $x = $(`<div />`);
  $x.append(`<a>foo</a>`);
  $x.append(`<c>bar</c>`);
  assert.equal(
    $x.html(),
    `<a>foo</a><c>bar</c>`
  );
  assert.deepEqual(
    $x.find(`a,c`).filter(`c`).text(),
    `bar`
  );
});

test(`$.closest`, (assert) => {
  let $x = $(`<div><a><b /></a></div>`);
  assert.equal(
    $x.find(`b`).closest(`a`)[0],
    $x.find(`a`)[0]
  );
  assert.ok(
    $x.find(`b`).closest(`a`).is($x.find(`a`))
  );
  assert.equal(
    $x.find(`b`).closest(`foo`).length,
    0
  );
});

test(`$.parentsUntil`, (assert) => {
  let $x = $(`<div><a><b><c /></b></a></div>`);
  assert.deepEqual(
    $x.find(`c`).parentsUntil(`a`).map(({ outerHTML }) => outerHTML),
    [ '<b><c></c></b>' ]
  );
  assert.deepEqual(
    $x.find(`c`).parentsUntil(`div`).map(({ outerHTML }) => outerHTML),
    [ '<b><c></c></b>', '<a><b><c></c></b></a>' ]
  );
});

test(`$.next $.nextAll`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  assert.equal(
    $x.find(`a`).next().text(),
    '2'
  );
  assert.equal(
    $x.find(`c`).next().length,
    0
  );
  assert.deepEqual(
    $x.find(`a`).nextAll().map(({ textContent }) => textContent),
    [ '2', '3' ]
  );
  assert.deepEqual(
    $x.find(`a`).nextAll('c').map(({ textContent }) => textContent),
    [ '3' ]
  );
});

test(`$.prev $.prevAll`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  assert.equal(
    $x.find(`c`).prev().text(),
    '2'
  );
  assert.equal(
    $x.find(`a`).prev().length,
    0
  );
  assert.deepEqual(
    $x.find(`c`).prevAll().map(({ textContent }) => textContent),
    [ '2', '1' ]
  );
  assert.deepEqual(
    $x.find(`c`).prevAll('a').map(({ textContent }) => textContent),
    [ '1' ]
  );
});

test(`$.siblings`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  assert.deepEqual(
    $x.find(`a`).siblings().map(({ textContent }) => textContent),
    [ '2', '3' ]
  );
  assert.deepEqual(
    $x.find(`b`).siblings().map(({ textContent }) => textContent),
    [ '1', '3' ]
  );
  assert.deepEqual(
    $x.find(`c`).siblings().map(({ textContent }) => textContent),
    [ '1', '2' ]
  );

  assert.deepEqual(
    $x.find(`a`).siblings(`c`).map(({ textContent }) => textContent),
    [ '3' ]
  );
});

test(`$.has`, (assert) => {
  let $x = $(`<div><a><b><c /></b></a></div>`);
  assert.deepEqual(
    $x.find(`a,b,c`).has(`c`).map(({ outerHTML }) => outerHTML),
    [ '<a><b><c></c></b></a>', '<b><c></c></b>' ]
  );
});

test(`$.toArray`, (assert) => {
  let $x = $(`<div><a><b><c /></b></a></div>`);
  assert.deepEqual(
    $x.find(`b,c`).toArray().map(({ outerHTML }) => outerHTML),
    [ '<b><c></c></b>', '<c></c>' ]
  );
  assert.ok(
    Array.isArray($x.find(`b,c`).toArray())
  );
  assert.notOk(
    $x.find(`b,c`).toArray().closest
  );
});

test(`$.replaceWith`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  $x.find(`a,c`).replaceWith(`<e></e>`);
  assert.deepEqual(
    $x.html(),
    `<e></e><b>2</b><e></e>`
  );
});

test(`$.first/last`, (assert) => {
  let $x = $(`<span><a>foo</a><a>bar<c /></a></span>`);
  assert.notOk(
    $x.find(`a`).first().has(`c`).length
  );
  assert.ok(
    $x.find(`a`).last().has(`c`).length
  );
});

