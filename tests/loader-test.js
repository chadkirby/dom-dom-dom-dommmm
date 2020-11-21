const test = require('./tape')(module);
const { loadHtml, loadXml } = require('../src/index');

test(`loadHtml loads`, (assert) => {
  let $ = loadHtml();
  assert.ok($, `can loadHtml with no argument`);
  assert.equal($.html(), `<html><head></head><body></body></html>`);
});

test(`loadHtml loads specific html`, (assert) => {
  let $ = loadHtml(`<p>Hi there!</p>`);
  assert.equal($.html(`p`), `<p>Hi there!</p>`);
});

test(`loadXml loads`, (assert) => {
  let $ = loadXml();
  assert.ok($, `can loadXml with no argument`);
  assert.equal($.html(), `<root/>`);
});

test(`loadXml loads specific html`, (assert) => {
  let $ = loadXml(`<Pr>Hi there!</Pr>`);
  assert.equal($.html(`Pr`), `<Pr>Hi there!</Pr>`);
});

test(`loadXml loads namespaces`, (assert) => {
  let numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:numbering
    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:abstractNum w:abstractNumId="1">
      <w:multiLevelType w:val="multiLevel"/>
      <w:lvl w:ilvl="0">
        <w:start w:val="1"/>
        <w:numFmt w:val="bullet"/>
        <w:lvlText w:val="•"/>
        <w:pPr>
          <w:ind w:left="360" w:hanging="360"/>
        </w:pPr>
      </w:lvl>
    </w:abstractNum>
  </w:numbering>`;

  let $ = loadXml(numberingXml);
  let $lvl = $(`w\\:lvl`);
  assert.equal($lvl.length, 1);
  assert.ok($(`<w:foo />`), 'can wrap namespaced xml');
  $lvl.setAttrNS('xml:space', 'preserve');
  assert.deepEqual(
    $lvl.attr(),
    { 'w:ilvl': '0', 'xml:space': 'preserve' }
  );

  let $root = $(`w\\:numbering`);
  $root.setAttrNS('xmlns:foo', 'bar');
  assert.equal(
    $root.document.lookupNamespaceURI('foo'),
    'bar'
  );

  $lvl.setAttrNS('foo:baz', '7');
  assert.deepEqual(
    $(`w\\:lvl`).attr(),
    { 'w:ilvl': '0', 'xml:space': 'preserve', 'foo:baz': '7' }
  );
});


test(`loadXml can define namespaces & create namespaced elements`, (assert) => {
  let $ = loadXml(`<Pr>Hi there!</Pr>`);

  assert.throws(
    () => $.createElementNS(`foo:div`),
    `can't create element in unknown namespace`
  );
  $('Pr').defineNamespace('foo', 'bar');

  assert.equal(
    $.createElementNS(`foo:div`).outerHtml(),
    `<foo:div xmlns:foo="bar"/>`
  );
});
