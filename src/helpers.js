const DOM = require('./dom');
const { isTextNode } = require('./is-node');
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
    if (endNode && endNode === child) {
      // stop the generator if this child is the end node
      return true;
    }
    if (isTextNode(child)) {
      yield child;
    } else if (yield* collectTextNodes(child, endNode)) {
      // stop the generator if this child contained the end node
      return true;
    }
  }
}

/**
 * empty a node
 *
 * @param   {HTMLElement}  el
 *
 * @return  {Iterable.HTMLElement}  iterates over text nodes
 */
function empty(el) {
  while (el.firstChild) {
    el.firstChild.remove();
  }
  return el;
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
  if (isFragment(fragment)) {
    const div = fragment.ownerDocument.createElement('div');
    div.appendChild(fragment.cloneNode(true));
    return div.innerHTML;
  }
  if (isDocument(fragment)) {
    const div = fragment.createElement('div');
    div.appendChild(fragment.documentElement.cloneNode(true));
    return div.innerHTML;
  }
  return fragment.innerHTML;
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

function isFragment(obj) {
  return obj && obj.nodeType === 11;
}

function isDocument(obj) {
  return obj && obj.nodeType === 9;
}

/**
 * create a document fragment from an html string
 * copied from JSDOM
 *
 * @param   {String}  string  outerHTML for the new fragment
 *
 * @return  {HTMLElement}  Document Fragment
 */
function createFragment(string = ``, document = DOM.document) {
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
function createElement(string = ``, document = DOM.document) {
  return createFragment(string, document).firstElementChild;
}

/**
 * return a text node
 *
 * @param   {String}  text  textContent for the new text node
 *
 * @return  {HTMLElement}
 */
function createTextNode(text, document = DOM.document) {
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
  return el === comparator;
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
  let attrs = Object.create(null);
  if (el) {
    for (const { name, value } of el.attributes) {
      attrs[name] = value;
    }
  }
  return attrs;
}

/**
 * seach for text in an element
 *
 * @param   {HTMLElement}  el  element to search
 *
 * @param   {RegExp}  pattern  search pattern
 *
 * @return  {Array}
 */
function splitSearch(el, pattern) {
  let { textContent } = el;
  let textNodes = collectTextNodes(el);
  let textMap = [];
  let counter = 0;
  for (const node of textNodes) {
    if (node.textContent) {
      textMap.push({
        start: counter,
        end: counter + node.textContent.length,
        node
      });
    }
    counter += node.textContent.length;
  }
  let out = [];
  let result;
  while ((result = pattern.exec(textContent))) {
    let found = [];
    let { index, 0: match } = result;
    let nodeIndex = textMap.findIndex(({ end }) => end > index);
    while (match) {
      let { start, node } = textMap[nodeIndex];
      let localOffset = index - start;
      let trailingNode = splitTextNode(node, localOffset + match.length);
      if (trailingNode) {
        textMap[nodeIndex].end = start + node.textContent.length;
        textMap.splice(nodeIndex + 1, 0, {
          start: textMap[nodeIndex].end,
          end: textMap[nodeIndex].end + trailingNode.textContent.length,
          node: trailingNode
        });
      }

      let resultNode = splitTextNode(node, localOffset);
      textMap[nodeIndex].end = start + node.textContent.length;
      found.push(resultNode);
      if (resultNode !== node) {
        textMap.splice(nodeIndex + 1, 0, {
          start: textMap[nodeIndex].end,
          end: textMap[nodeIndex].end + resultNode.textContent.length,
          node: resultNode
        });
        nodeIndex += 1;
      }
      match = match.slice(node.textContent.length);
      index += node.textContent.length;
      nodeIndex += 1;
    }
    if (!pattern.global) {
      return found;
    }
    out.push(found);
  }
  return out;
}


// split a text node at the given char offset
function splitTextNode(node, offset) {
  let { textContent } = node;
  if (offset < 0) {
    offset += textContent.length;
  }
  if (offset === 0) {
    return node;
  }
  if (offset < 0 || offset >= textContent.length) {
    return;
  }
  // crop the text content of the existing text node
  node.textContent = textContent.slice(0, offset);
  // insert a new text node with the remaining text (if any)
  let newNode = createTextNode(textContent.slice(offset));
  node.after(newNode);
  // return the text node we just inserted
  return newNode;
}


function* previousSiblings(el) {
  while (el && (el = el.previousSibling)) {
    yield el;
  }
}

function* previousElementSiblings(el) {
  while (el && (el = el.previousElementSibling)) {
    yield el;
  }
}

function* nextSiblings(el) {
  while (el && (el = el.nextSibling)) {
    yield el;
  }
}

function* nextElementSiblings(el) {
  while (el && (el = el.nextElementSibling)) {
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
  if (Buffer.isBuffer(string)) {
    string = string.toString();
  }

  let dom = new DOM.window.DOMParser().parseFromString(
    string,
    contentType
  );
  if (dom.firstElementChild.matches('parsererror')) {
    throw new Error(dom.firstElementChild.textContent);
  }
  return dom;
}

function isSelector(thing) {
  return typeof thing === 'string' && !isHtml(thing);
}
function isHtml(thing) {
  return typeof thing === 'string' && /^\s*<\w.*?>/.test(thing);
}

const NAMESPACES = Object.assign(Object.create(null), {
  xml: 'http://www.w3.org/XML/1998/namespace',
  xmlns: 'http://www.w3.org/2000/xmlns/'
});
function lookupNamespaceURI(prefix, document) {
  [ prefix ] = prefix.split(':');
  return NAMESPACES[prefix.toLowerCase()] || (document && document.lookupNamespaceURI(prefix));
}

module.exports = {
  attr,
  closest,
  collectTextNodes,
  createElement,
  createFragment,
  createTextNode,
  empty,
  filterTextNodes,
  fragmentToHtml,
  fragmentToText,
  hasDescendant,
  isHtml,
  isSelector,
  lookupNamespaceURI,
  parentsUntil,
  parse,
  previousElementSiblings,
  previousSiblings,
  nextElementSiblings,
  nextSiblings,
  nodeToSelector,
  splitSearch,
  unwrap
};
