const { window, document: globalDocument } = require('./dom');
const { collectTextNodes, createTextNode } = require('./helpers');

function makeDom(document) {
  return function(...args) {
    let div = document.createElement('div');
    try {
      if (document.contentType.toLowerCase().endsWith('xml')) {
        // add the div to the DOM so it will inherit the
        // document's namespaces
        document.firstElementChild.append(div);
      }
      div.innerHTML = assemble(...args);
    } finally {
      div.remove();
    }

    for (const node of collectTextNodes(div)) {
      let trimmed = node.textContent.replace(/^\s*\n\s*|\s*\n\s*$/g, '');
      if (node.textContent && !trimmed) {
        // remove the node if we just emptied it out
        node.remove();
      } else {
        node.textContent = trimmed;
      }
    }
    return div;
  };

}

/**
 * Tagged template function to convert possibly pretty html to an unpretty
 * document fragment. E.g.
 *
 * dom`&lt;p>foo&lt;\p>`
 *
 *  @param   {TemplateStringsArray}  ...  template literal
 *
 * @return  {HTMLElement}  document fragment
 */
let dom = makeDom(globalDocument);

/**
 * Tagged template function to convert html to an element. E.g.
 *
 * el`&lt;p>foo&lt;/p>`
 *
 * @param   {TemplateStringsArray}  ...  template literal
 *
 * @return  {HTMLElement}  element
 */
function el(...args) {
  return dom(...args).firstElementChild;
}

/**
 * Tagged template function to create a text node. E.g.
 *
 * text`foo`
 *
 * @param   {TemplateStringsArray}  ...  template literal
 *
 * @return  {HTMLElement}  element
 */
function text(...args) {
  return createTextNode(assemble(...args));
}

/**
 * Tagged template function to de-format an html string. E.g.
 *
 *  unpretty`&lt;p>
 *   &lt;foo />
 * &lt;/p>` === '&lt;p>&lt;foo>&lt;/foo>&lt;/p>'
 *
 * @param   {TemplateStringsArray}  ...  template literal
 *
 * @return  {string}  de-formatted html
 */
function unpretty(...args) {
  return dom(...args).innerHTML;
}

function unprettyns(namespaces = {}) {
  let xml = `<?xml version="1.0" encoding="utf-8" ?><root`;
  for (const [ prefix, ns ] of Object.entries(namespaces)) {
    xml += ` xmlns:${prefix}="${ns}"`;
  }
  xml += ' />';
  let document = new window.DOMParser().parseFromString(
    xml,
    "text/xml"
  );
  if (document.firstElementChild.matches('parsererror')) {
    throw new Error(document.firstElementChild.textContent);
  }
  function unprettyx(...args) {
    return makeDom(document)(...args).innerHTML;
  }

  return unprettyx;
}

/**
 * assemble a template literal into a string
 */
function assemble(strings, ...placeholders) {
  return Object.entries(strings).map(
    ([ i, str ]) => `${str}${placeholders[i] || ``}`
  ).join(``);
}

module.exports = {
  dom,
  el,
  text,
  unpretty,
  unprettyns
};
