const { collectTextNodes, createFragment, createElement, fragmentToHtml } = require('./helpers');

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
function dom(...args) {
  let $ = createFragment(assemble(...args));
  for (const node of collectTextNodes($)) {
    let trimmed = node.textContent.replace(/^\s*\n\s*|\s*\n\s*$/g, '');
    if (node.textContent && !trimmed) {
      // remove the node if we just emptied it out
      node.remove();
    } else {
      node.textContent = trimmed;
    }
  }
  return $;
}

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
  return createElement(assemble(...args));
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
  let $ = dom(...args);
  return fragmentToHtml($);
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
  unpretty
};
