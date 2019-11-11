const globalThis = require('globalthis')();

/**
 * iterator to collect text nodes from a dom element
 *
 * @param   {HTMLElement}  el  dom element
 *
 * @return  {Iterable.HTMLElement}      iterates over text nodes
 */
function* collectTextNodes(el) {
  for (const child of el.childNodes) {
    if (child.nodeName === `#text`) {
      yield child;
    } else {
      yield* collectTextNodes(child);
    }
  }
}

/**
 * convert a document fragment to html
 *
 * @param   {HTMLElement}  fragment  document fragment
 *
 * @return  {string}
 */
function fragmentToHtml(fragment) {
  return [ ...fragment.childNodes ].map((n) => n.outerHTML).join(``);
}

/**
 * create a document fragment from an html string
 * copied from JSDOM
 *
 * @param   {String}  string  outerHTML for the new fragment
 *
 * @return  {HTMLElement}  Document Fragment
 */
function createFragment(string = ``) {
  // the HTMLTemplateElement has a content property, which is a read-only
  // DocumentFragment containing the DOM subtree that the template represents.
  const template = globalThis.document.createElement(`template`);
  template.innerHTML = string;
  return template.content;
}

/**
 * create one HTML element from an html string
 *
 * @param   {string}  html  e.g. `<span />`
 *
 * @return  {HTMLElement}
 */
function createElement(html = ``) {
  return createFragment(html).firstChild;
}

/**
 * return a text node
 *
 * @param   {String}  text  textContent for the new text node
 *
 * @return  {HTMLElement}
 */
function createTextNode(text) {
  return globalThis.document.createTextNode(text);
}

/**
 * iterate over a dom element's parents until a target
 * element or selector is found
 *
 * @param   {HTMLElement}  childNode
 * @param   {HTMLElement|string}  target
 *
 * @return  {Iterable.HTMLElement}
 */
function* parentsUntil(childNode, target) {
  let current = childNode.parentElement;
  while (current && !matches(current, target)) {
    yield current;
    current = current.parentElement;
  }

  function matches(node, comparator) {
    if (typeof comparator === `string`) {
      return node.matches(comparator);
    }
    return node.isSameNode(comparator);
  }
}

/**
 * get the first element that matches the selector by
 * testing the element itself and traversing up through its
 * ancestors in the DOM tree.
 *
 * @param   {HTMLElement}  el
 * @param   {string}  selector
 *
 * @return  {HTMLElement|null}
 */
function closest(el, selector) {
  if (el.matches(selector)) {
    return el;
  }
  let child = [ ...parentsUntil(el, selector) ].pop();
  return child && child.parentElement;
}

/**
 * unwrap the contents of an element
 *
 * @param   {HTMLElement}  el  element to unwrap
 *
 * @return  {undefined}
 */
function unwrap(el) {
  // move all children out of the element
  while (el.firstChild) {
    el.before(el.firstChild);
  }
  // remove the empty element
  el.remove();
}

module.exports = {
  closest,
  collectTextNodes,
  createElement,
  createFragment,
  createTextNode,
  fragmentToHtml,
  parentsUntil,
  unwrap
};
