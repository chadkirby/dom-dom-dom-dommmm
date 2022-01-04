import getTest from './tape.js';
const test = getTest({ filename: import.meta.url });

import { dom, el, text, unpretty, fragmentToHtml } from '../dist/index.js';

test(`el creates element`, (assert) => {
  assert.equal(el`<span />`.outerHTML, `<span></span>`);

  assert.equal(el`<span />`.nodeName, `SPAN`);

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

  assert.equal(el`foo`, null);

  assert.equal(
    el`foo <span />`.outerHTML,
    `<span></span>`,
    `first element is returned`
  );
});

test(`dom creates fragment`, (assert) => {
  assert.equal(fragmentToHtml(dom`<span />`), `<span></span>`);

  assert.equal(dom`<span />`.nodeName, `DIV`);

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

  assert.equal(fragmentToHtml(dom`foo`), `foo`);

  assert.equal(
    fragmentToHtml(dom`
    foo <span></span> bar
    `),
    `foo <span></span> bar`
  );

  let $doc = dom`
  <span />
  `;
  assert.equal(
    $doc.firstChild.nodeName,
    `SPAN`,
    `firstChild is not empty text node`
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

test(`text creates text node`, (assert) => {
  assert.equal(text`<span />`.textContent, `<span />`);

  assert.equal(text`<span />`.nodeName, `#text`);

  assert.equal(
    text`
    123
    `.textContent,
    `\n    123\n    `
  );

  assert.equal(text``.textContent, ``);
});
