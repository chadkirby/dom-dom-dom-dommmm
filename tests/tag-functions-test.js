let test = require('./tape')(module);
let { dom, el, unpretty, fragmentToHtml } = require('../src/index');

test(`el creates element`, (assert) => {
  assert.equal(
    el`<span />`.outerHTML,
    `<span></span>`
  );

  assert.equal(
    el`<span />`.nodeName,
    `SPAN`
  );

  assert.equal(
    el`<span
      foo='bar'
    />`.outerHTML,
    `<span foo="bar"></span>`
  );

  assert.equal(
    el` <span foo='bar'></span> `.outerHTML,
    `<span foo="bar"></span>`,
    `tolerates extra whitespace`
  );

  assert.equal(
    el`foo`,
    null
  );

  assert.equal(
    el`foo <span />`.outerHTML,
    `<span></span>`,
    `first element is returned`
  );

});

test(`dom creates fragment`, (assert) => {
  assert.equal(
    fragmentToHtml(dom`<span />`),
    `<span></span>`
  );

  assert.equal(
    dom`<span />`.nodeName,
    `#document-fragment`
  );

  assert.equal(
    fragmentToHtml(
      dom`<span
        foo='bar'
      />`
    ),
    `<span foo="bar"></span>`
  );

  assert.equal(
    fragmentToHtml(dom` <span foo='bar'>
    </span> `),
    ` <span foo="bar"></span> `
  );

  assert.equal(
    fragmentToHtml(dom`foo`),
    `foo`
  );

  assert.equal(
    fragmentToHtml(dom`
    foo <span></span> bar
    `),
    `foo <span></span> bar`
  );

});

test(`unpretty de-formats an html string`, (assert) => {
  assert.equal(
    unpretty`<p>
      <span />
    </p>`,
    `<p><span></span></p>`
  );
  assert.equal(
    unpretty`
    <p
      foo='bar'
      baz='bat'
    />
    `,
    `<p foo="bar" baz="bat"></p>`
  );

  assert.equal(
    unpretty`<p>
      Text with
      newlines
    </p>`,
    `<p>Text with
      newlines</p>`
  );

  assert.equal(
    unpretty`
    <p>
      foo
      <span>
        bar
      </span>
      baz
      <span>
        bat
      </span>
    </p>`,
    `<p>foo<span>bar</span>baz<span>bat</span></p>`
  );
});
