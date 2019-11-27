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
