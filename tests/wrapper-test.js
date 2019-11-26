const test = require('./tape')(module);
const { $, el, createTextNode } = require('../src/index');

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
    $x.filterSelector(`span`)[0],
    span,
    `can filter element by selector`
  );
  assert.equal($x.html(), `foo`, `html function exists & returns innerHTML`);
  $x.html(`bar`);
  assert.equal($x.html(), `bar`, `html function sets innerHTML & returns the domarray`);

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
    $x.filterSelector(`span`),
    [ span ],
    `can filter element by selector`
  );
  assert.equal($x.html(), `foo`, `html function exists & returns innerHTML`);
  $x.html(`bar`);
  assert.equal($x.html(), `bar`, `html function sets innerHTML`);
});

test(`$.query`, (assert) => {
  let $x = $(`<span><a>foo</a><a>bar<c /></a></span>`);
  assert.equal(
    $x.query(`a`).text(),
    `foo`
  );
  assert.equal(
    $x.query(`b`).length,
    0
  );

  assert.equal(
    $x.queryAll(`c`).length,
    1
  );
  assert.equal(
    $x.queryAll(`a`).length,
    2
  );
  assert.equal(
    $x.queryAll(`a`).filter((a) => a.querySelector(`c`)).length,
    1
  );
  assert.equal(
    $x.queryAll(`a`).filter((a) => a.querySelector(`c`)).html(),
    `bar<c></c>`
  );
  assert.equal(
    $x.queryAll(`a`).first().queryAll(`a`).length,
    0
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
  assert.equal(
    $x.is(`[id]`),
    $x[0]
  );
  assert.equal(
    $x.is(`[id=3]`),
    $x[0]
  );
  assert.equal(
    $x.is(`[foo^=b]`),
    $x[0]
  );
  assert.equal($x.toSelector(), `span[id="3"][foo="bar"]`);
});

test(`$.attr`, (assert) => {
  let $x = $(`<span id='2' foo='bar' />`);
  assert.deepEqual(
    $x.attr(),
    { id: '2', foo: 'bar' }
  );
  $x.attr('id', 3);
  assert.equal(
    $x[0].outerHTML,
    `<span id="3" foo="bar"></span>`
  );
  $x.removeAttr('id');
  assert.equal(
    $x[0].outerHTML,
    `<span foo="bar"></span>`
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

test(`$.query.filter`, (assert) => {
  let $x = $(`<div />`);
  $x.append(`<a>foo</a>`);
  $x.append(`<c>bar</c>`);
  assert.equal(
    $x.html(),
    `<a>foo</a><c>bar</c>`
  );
  assert.deepEqual(
    $x.queryAll(`a,c`).filterSelector(`c`).text(),
    `bar`
  );
});

test(`$.closest`, (assert) => {
  let $x = $(`<div><a><b /></a></div>`);
  assert.equal(
    $x.queryAll(`b`).closest(`a`)[0],
    $x.queryAll(`a`)[0]
  );
  assert.ok(
    $x.queryAll(`b`).closest(`a`).is($x.queryAll(`a`))
  );
  assert.equal(
    $x.queryAll(`b`).closest(`foo`).length,
    0
  );
});

test(`$.parentsUntil`, (assert) => {
  let $x = $(`<div><a><b><c /></b></a></div>`);
  assert.deepEqual(
    $x.queryAll(`c`).parentsUntil(`a`).map(({ outerHTML }) => outerHTML),
    [ '<b><c></c></b>' ]
  );
  assert.deepEqual(
    $x.queryAll(`c`).parentsUntil(`div`).map(({ outerHTML }) => outerHTML),
    [ '<b><c></c></b>', '<a><b><c></c></b></a>' ]
  );
  let $a = $x.queryAll('a');
  assert.deepEqual(
    $x.queryAll(`c`).parentsUntil($a).map(({ outerHTML }) => outerHTML),
    [ '<b><c></c></b>' ]
  );

});

test(`$.next $.nextAll`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  assert.equal(
    $x.queryAll(`a`).next().text(),
    '2'
  );
  assert.equal(
    $x.queryAll(`c`).next().length,
    0
  );
  assert.deepEqual(
    $x.queryAll(`a`).nextAll().map(({ textContent }) => textContent),
    [ '2', '3' ]
  );
  assert.deepEqual(
    $x.queryAll(`a`).nextAll('c').map(({ textContent }) => textContent),
    [ '3' ]
  );
});

test(`$.prev $.prevAll $.prevUntil`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  assert.equal(
    $x.queryAll(`c`).prev().text(),
    '2'
  );
  assert.equal(
    $x.queryAll(`a`).prev().length,
    0
  );
  assert.deepEqual(
    $x.queryAll(`c`).prevAll().map(({ textContent }) => textContent),
    [ '2', '1' ]
  );
  assert.deepEqual(
    $x.queryAll(`c`).prevAll('a').map(({ textContent }) => textContent),
    [ '1' ]
  );
  assert.deepEqual(
    $x.queryAll(`c`).prevUntil('a').map(({ textContent }) => textContent),
    [ '2' ]
  );
});

test(`$.siblings`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  assert.deepEqual(
    $x.queryAll(`a`).siblings().map(({ textContent }) => textContent),
    [ '2', '3' ]
  );
  assert.deepEqual(
    $x.queryAll(`b`).siblings().map(({ textContent }) => textContent),
    [ '1', '3' ]
  );
  assert.deepEqual(
    $x.queryAll(`c`).siblings().map(({ textContent }) => textContent),
    [ '1', '2' ]
  );

  assert.deepEqual(
    $x.queryAll(`a`).siblings(`c`).map(({ textContent }) => textContent),
    [ '3' ]
  );
});

test(`$.hasSelector`, (assert) => {
  let $x = $(`<div><a><b><c /></b></a></div>`);
  assert.deepEqual(
    $x.queryAll(`a,b,c`).hasSelector(`c`).map(({ outerHTML }) => outerHTML),
    [ '<a><b><c></c></b></a>', '<b><c></c></b>' ]
  );
});

test(`$.hasNode`, (assert) => {
  let $x = $(`<div><a><b><c /></b></a><a /></div>`);
  let $c = $x.query(`c`);
  assert.deepEqual(
    $x.queryAll(`a,b,c`).hasNode($c).map(({ outerHTML }) => outerHTML),
    [ '<a><b><c></c></b></a>', '<b><c></c></b>' ]
  );
});

test(`$.toArray`, (assert) => {
  let $x = $(`<div><a><b><c /></b></a></div>`);
  assert.deepEqual(
    $x.queryAll(`b,c`).toArray().map(({ outerHTML }) => outerHTML),
    [ '<b><c></c></b>', '<c></c>' ]
  );
  assert.ok(
    Array.isArray($x.queryAll(`b,c`).toArray())
  );
  assert.notOk(
    $x.queryAll(`b,c`).toArray().closest
  );
});

test(`$.replaceWith`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  $x.queryAll(`a,c`).replaceWith(`<e></e>`);
  assert.deepEqual(
    $x.html(),
    `<e></e><b>2</b><e></e>`
  );

  $x = $(`<div><a>1</a><b>2</b></div>`);
  $x.queryAll(`a`).replaceWith($(`<e></e>`));
  assert.deepEqual(
    $x.html(),
    `<e></e><b>2</b>`
  );
});

test(`$.first/last`, (assert) => {
  let $x = $(`<span><a>foo</a><a>bar<c /></a></span>`);
  assert.notOk(
    $x.queryAll(`a`).first().hasSelector(`c`).length
  );
  assert.ok(
    $x.queryAll(`a`).last().hasSelector(`c`).length
  );
});

test(`:has()`, (assert) => {
  let $x = $(`<div><a></a><a><c /></a></div>`);
  assert.deepEqual(
    $x.query(`a:has(c)`)[0].outerHTML,
    `<a><c></c></a>`
  );
});

test(`$.outerHtml`, (assert) => {
  assert.equal(
    $(el`<span><a>foo</a><a>bar</a></span>`).outerHtml(),
    `<span><a>foo</a><a>bar</a></span>`
  );
  assert.equal(
    $(`<span><a>foo</a><a>bar</a></span>`).outerHtml(),
    `<span><a>foo</a><a>bar</a></span>`
  );
});

test(`$.append`, (assert) => {
  let $x = $(`<div />`);
  let $a = $(`<a>foo</a>`);
  let $c = $(`<c>bar</c>`);
  $x.append($a).append($c);
  assert.equal(
    $x.html(),
    `<a>foo</a><c>bar</c>`
  );
  assert.deepEqual(
    $x.queryAll(`a,c`).filterSelector(`c`).text(),
    `bar`
  );

  $x = $(`<div />`);
  let $y = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  $x.append($y.children());
  assert.equal(
    $x.html(),
    `<a>1</a><b>2</b><c>3</c>`
  );
  assert.equal(
    $y.html(),
    ``
  );

});

test(`set text`, (assert) => {
  let $x = $(`<div />`);
  let $a = $(`<a></a>`);
  $x.append($a);
  $a.text('foo');
  assert.equal(
    $x.html(),
    `<a>foo</a>`
  );
  $x = $(createTextNode('')).text('foo');
  assert.equal(
    $x.text(),
    `foo`
  );
  $x = $(`<div />`).text('foo');
  assert.equal(
    $x[0].outerHTML,
    `<div>foo</div>`
  );
});

test(`$.before`, (assert) => {
  let $x = $(`<div />`);
  let $a = $(`<a>foo</a>`);
  let $c = $(`<c>bar</c>`);
  $x.append($c);
  $c.before($a);
  assert.equal(
    $x.html(),
    `<a>foo</a><c>bar</c>`
  );
  assert.deepEqual(
    $x.queryAll(`a,c`).filterSelector(`c`).text(),
    `bar`
  );
});

test(`$.parent`, (assert) => {
  let $x = $(`<div />`);
  let $a = $(`<a>foo</a>`);
  let $c = $(`<c>bar</c>`);
  $x.append($a);
  $a.append($c);
  assert.equal(
    $x.html(),
    `<a>foo<c>bar</c></a>`
  );
  assert.deepEqual(
    $c.parent()[0].outerHTML,
    `<a>foo<c>bar</c></a>`
  );
});

test(`$.remove`, (assert) => {
  let $x = $(`<div><a>foo<c>bar</c></a></div>`);
  $x.query(`c`).remove();
  assert.equal(
    $x.html(),
    `<a>foo</a>`
  );
  $x.queryAll(`a`).remove();
  assert.equal(
    $x.html(),
    ``
  );
});

test(`$.children`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  assert.deepEqual(
    $x.first().children().map((node) => node.outerHTML),
    [ '<a>1</a>', '<b>2</b>', '<c>3</c>' ]
  );
});

test(`$.wrap`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  $x.queryAll(`a,b`).wrap(`<xx />`);
  assert.deepEqual(
    $x.html(),
    `<xx><a>1</a></xx><xx><b>2</b></xx><c>3</c>`
  );
});

test(`$.wrap`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  assert.deepEqual(
    $x.queryAll(`a,b`).eq(0).text(),
    `1`
  );
  assert.deepEqual(
    $x.queryAll(`a,b`).eq(1).text(),
    `2`
  );
  assert.deepEqual(
    $x.queryAll(`a,b`).eq(2).text(),
    ``
  );
});

test(`$.not`, (assert) => {
  let $x = $(`<div><a>1</a><b>2</b><c>3</c></div>`);
  assert.deepEqual(
    $x.queryAll(`a,b,c`).without(`a,b`).map((node) => node.outerHTML),
    [ '<c>3</c>' ]
  );
  assert.deepEqual(
    $x.queryAll(`a,b,c`).filter((node) => !node.matches(`a,b`)).map((node) => node.outerHTML),
    [ '<c>3</c>' ]
  );
});

test(`$.css`, (assert) => {
  let $x = $(`<div><a style="color:blue;font-size:46px;"></a></div>`);
  assert.deepEqual(
    $x.query(`a`).css(`color`),
    `blue`
  );

  assert.deepEqual(
    $x.query(`a`).css(`font-size`),
    `46px`
  );

});

test(`$.contents`, (assert) => {
  let $x = $(`<div>abc<a>1</a>def</div>`);
  assert.deepEqual(
    $x.contents().map((node) => $(node).text()),
    [ 'abc', '1', 'def' ]
  );
  assert.deepEqual(
    $x.contents().filterSelector('a').map((node) => $(node).text()),
    [  '1' ]
  );
  assert.deepEqual(
    $x.contents().filter((node) => $(node).is('a')).map((node) => $(node).text()),
    [ '1' ]
  );
  assert.deepEqual(
    $x.contents().filter((node) => $(node).isTextNode).map((node) => $(node).text()),
    [ 'abc', 'def' ]
  );
});

test(`$.query with text nodes`, (assert) => {
  let $x = $(`<div><a></a>foo</div>bar`);
  assert.equal(
    $x.query(`a`).length,
    1
  );
  assert.equal(
    $x.queryAll(`a`).length,
    1
  );
});
