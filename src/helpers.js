const { window, document: globalDocument } = require('./dom');
/**
 * iterator to collect text nodes from a dom element
 *
 * @param   {HTMLElement}  el  start element
 * @param   {HTMLElement}  endNode  stop element
 *
 * @return  {Iterable.HTMLElement}  iterates over text nodes
 */
function* collectTextNodes(el, endNode) {
  // get a list of the element's children in case the dom is modified between
  // yields
  let children = Array.from(el.childNodes);
  for (const child of children) {
    if (endNode && endNode.isSameNode(child)) {
      // stop the generator if this child is the end node
      return true;
    }
    if (child.nodeName === `#text`) {
      yield child;
    } else if (yield* collectTextNodes(child, endNode)) {
      // stop the generator if this child contained the end node
      return true;
    }
  }
}

/**
 * collect text nodes that satisfy a filter function
 *
 * @param   {HTMLElement}  el
 * @param   {Function}  filterFn
 *
 * @return  {Iterable.HTMLElement}  iterates over text nodes
 */
function* filterTextNodes(el, filterFn) {
  let getNodes = collectTextNodes(el);
  let tNode;
  while ((tNode = getNodes.next().value)) {
    if (filterFn(tNode)) {
      yield tNode;
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
  return [ ...fragment.childNodes ].map(
    (n) => n.nodeName === `#text` ? n.textContent : n.outerHTML
  ).join(``);
}

/**
 * convert a document fragment to html
 *
 * @param   {HTMLElement}  fragment  document fragment
 *
 * @return  {string}
 */
function fragmentToText(fragment) {
  return [ ...fragment.childNodes ].map(
    (n) => n.textContent
  ).join(``);
}

/**
 * create a document fragment from an html string
 * copied from JSDOM
 *
 * @param   {String}  string  outerHTML for the new fragment
 *
 * @return  {HTMLElement}  Document Fragment
 */
function createFragment(string = ``, document = globalDocument) {
  const template = document.createElement(`template`);
  template.innerHTML = string;
  if (template.content) {
    // the HTMLTemplateElement has a content property, which is a read-only
    // DocumentFragment containing the DOM subtree that the template represents.
    return template.content;
  }
  let fragment = document.createDocumentFragment();
  while (template.firstChild) {
    fragment.append(template.firstChild);
  }
  return fragment;
}

/**
 * create one HTML element from an html string
 *
 * @param   {string}  html  e.g. `<span />`
 *
 * @return  {HTMLElement}
 */
function createElement(string = ``, document = globalDocument) {
  return createFragment(string, document).firstElementChild;
}

/**
 * return a text node
 *
 * @param   {String}  text  textContent for the new text node
 *
 * @return  {HTMLElement}
 */
function createTextNode(text, document = globalDocument) {
  return document.createTextNode(text);
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
}

function matches(el, comparator) {
  if (!el) {
    return false;
  }
  if (typeof comparator === `function`) {
    return comparator(el);
  }
  if (typeof comparator === `string`) {
    return el.matches && el.matches(comparator);
  }
  if (Array.isArray(comparator)) {
    [ comparator ] = comparator;
  }
  return el.isSameNode(comparator);
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
  while (el && !matches(el, selector)) {
    el = el.parentElement;
  }
  return el;
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

/**
 * convert element.attributes NamedNodeMap to a POJO
 *
 * @param   {HTMLElement} el
 *
 * @return  {Object}
 */
function attr(el) {
  if (!el) {
    return {};
  }
  return Object.assign(...Array.from(
    el.attributes,
    ({ name, value }) => ({ [name]: value })
  ));
}

function* previousSiblings(el) {
  while (el && (el = el.previousSibling)) {
    yield el;
  }
}

function* nextSiblings(el) {
  while (el && (el = el.nextSibling)) {
    yield el;
  }
}

function nodeToSelector(node) {
  return [
    node.nodeName.toLowerCase(),
    ...Array.from(node.attributes).map(
      ({ name, value }) => value ? `[${name}="${value}"]` : ``
    )
  ].join(``);
}

function hasDescendant(parent, target) {
  // traverse breadth-first
  const queue = Array.from(parent.childNodes);
  let current;
  while ((current = queue.shift())) {
    if (current === target) {
      return true;
    }
    if (current.childNodes) {
      queue.push(...current.childNodes);
    }
  }
}

function parse(string, contentType) {
  return new window.DOMParser().parseFromString(
    string,
    contentType
  );
}


module.exports = {
  attr,
  closest,
  collectTextNodes,
  createElement,
  createFragment,
  createTextNode,
  filterTextNodes,
  fragmentToHtml,
  fragmentToText,
  hasDescendant,
  parentsUntil,
  parse,
  previousSiblings,
  nextSiblings,
  nodeToSelector,
  unwrap
};
