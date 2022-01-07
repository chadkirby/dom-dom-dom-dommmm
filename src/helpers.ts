import { isEl, isNode, isTextNode } from './is-node.js';
/**
 * iterator to collect text nodes from a dom element
 *
 */
export function* collectTextNodes(el: Node, endNode?: Node): Generator<Text> {
  // get a list of the element's children in case the dom is modified between
  // yields
  const children = Array.from(el.childNodes);
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
 */
export function empty(el: Node): Node {
  while (el.firstChild) {
    el.firstChild.remove();
  }
  return el;
}

/**
 * collect text nodes that satisfy a filter function
 */
export function* filterTextNodes(
  el: Node,
  filterFn: (Node) => boolean
): Generator<Text> {
  const getNodes = collectTextNodes(el);
  let tNode;
  while ((tNode = getNodes.next().value)) {
    if (filterFn(tNode)) {
      yield tNode;
    }
  }
}

/**
 * convert a document fragment to html
 */
export function fragmentToHtml(
  fragment: Document | DocumentFragment | Element
): string {
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
 */
export function fragmentToText(fragment: Document | DocumentFragment): string {
  return [...fragment.childNodes].map((n) => n.textContent).join(``);
}

export function isFragment(obj: Node): obj is DocumentFragment {
  return obj && obj.nodeType === 11;
}

export function isDocument(obj: Node): obj is Document {
  return obj.nodeType === 9;
}

/**
 * create a document fragment from an html string
 * copied from JSDOM
 *
 */
export function createFragment(
  html = ``,
  document = globalThis.document
): DocumentFragment {
  const template = document.createElement(`template`);
  template.innerHTML = html;
  if (template.content) {
    // the HTMLTemplateElement has a content property, which is a read-only
    // DocumentFragment containing the DOM subtree that the template represents.
    return template.content;
  }
  const fragment = document.createDocumentFragment();
  while (template.firstChild) {
    fragment.append(template.firstChild);
  }
  return fragment;
}

/**
 * create one HTML element from an html string
 *
 */
export function createElement(
  html = ``,
  document = globalThis.document
): Element | null {
  return createFragment(html, document).firstElementChild;
}

/**
 * return a text node
 *
 */
export function createTextNode(
  text: string,
  document = globalThis.document
): Text {
  return document.createTextNode(text);
}

/**
 * iterate over a dom element's parents until a target
 * element or selector is found
 *
 */
type Matchable = Node | Node[] | string | ((node: Node) => boolean);
export function* parentsUntil(
  childNode: Element,
  target: Matchable
): Generator<Element> {
  let current = childNode.parentElement;
  while (current && !matches(current, target)) {
    yield current;
    current = current.parentElement;
  }
}

export function matches(el: Element, comparator: Matchable): boolean {
  if (!isEl(el)) {
    return false;
  }
  if (typeof comparator === `function`) {
    return comparator(el);
  }
  if (typeof comparator === `string`) {
    return el.matches(comparator);
  }
  if (Array.isArray(comparator)) {
    [comparator] = comparator;
  }
  return el === comparator;
}

/**
 * get the first element that matches the selector by
 * testing the element itself and traversing up through its
 * ancestors in the DOM tree.
 */
export function closest(el: unknown, matcher: Matchable): Element | null {
  if (!isNode(el)) return null;
  let out: Element | null = isEl(el) ? el : el.parentElement;
  while (out !== null && !matches(out, matcher)) {
    out = out.parentElement;
  }
  return out;
}

/**
 * unwrap the contents of an element
 *
 */
export function unwrap(el: Element): void {
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
 */
export function attr(el: Element): Record<string, string> {
  const attrs = Object.create(null);
  if (el) {
    for (const { name, value } of el.attributes) {
      attrs[name] = value;
    }
  }
  return attrs;
}

/**
 * seach for text in an element
 */
export function splitSearch(el: Element, pattern: RegExp): Text[][] | Text[] {
  const textContent = el.textContent || '';
  const textNodes = collectTextNodes(el);
  const textMap: { start: number; end: number; node: Text }[] = [];
  let counter = 0;
  for (const node of textNodes) {
    if (node.textContent) {
      textMap.push({
        start: counter,
        end: counter + node.textContent.length,
        node,
      });
    }
    counter += (node.textContent || '').length;
  }
  const out: Text[][] = [];
  let result;
  while ((result = pattern.exec(textContent))) {
    const found: Text[] = [];
    let { index, 0: match } = result;
    let nodeIndex = textMap.findIndex(({ end }) => end > index);
    while (match) {
      const { start, node } = textMap[nodeIndex];
      const localOffset = index - start;
      const trailingNode = splitTextNode(node, localOffset + match.length);
      if (trailingNode) {
        textMap[nodeIndex].end = start + len(node);
        textMap.splice(nodeIndex + 1, 0, {
          start: textMap[nodeIndex].end,
          end: textMap[nodeIndex].end + len(trailingNode),
          node: trailingNode,
        });
      }

      // resultNode should always exist
      const resultNode = splitTextNode(node, localOffset)!;
      textMap[nodeIndex].end = start + len(node);
      found.push(resultNode);
      if (resultNode !== node) {
        textMap.splice(nodeIndex + 1, 0, {
          start: textMap[nodeIndex].end,
          end: textMap[nodeIndex].end + len(resultNode),
          node: resultNode,
        });
        nodeIndex += 1;
      }
      match = match.slice(len(node));
      index += len(node);
      nodeIndex += 1;
    }
    if (!pattern.global) {
      return found;
    }
    out.push(found);
  }
  return out;
}

function len(node: Node): number {
  return (node.textContent || '').length;
}

// split a text node at the given char offset
export function splitTextNode(node: Text, offset: number): Text | null {
  const textContent = node.textContent || '';
  if (offset < 0) {
    offset += textContent.length;
  }
  if (offset === 0) {
    return node;
  }
  if (offset < 0 || offset >= textContent.length) {
    return null;
  }
  // crop the text content of the existing text node
  node.textContent = textContent.slice(0, offset);
  // insert a new text node with the remaining text (if any)
  const newNode = createTextNode(textContent.slice(offset));
  node.after(newNode);
  // return the text node we just inserted
  return newNode;
}

export function* previousSiblings(el: Node): Generator<Node> {
  while (el !== null && el.previousSibling !== null) {
    el = el.previousSibling;
    yield el;
  }
}

export function* previousElementSiblings(el: Element): Generator<Element> {
  while (el !== null && el.previousElementSibling !== null) {
    el = el.previousElementSibling;
    yield el;
  }
}

export function* nextSiblings(el: Node): Generator<Node> {
  while (el !== null && el.nextSibling !== null) {
    el = el.nextSibling;
    yield el;
  }
}

export function* nextElementSiblings(el: Element): Generator<Element> {
  while (el !== null && el.nextElementSibling !== null) {
    el = el.nextElementSibling;
    yield el;
  }
}

export function nodeToSelector(node: Element): string {
  return [
    node.nodeName.toLowerCase(),
    ...Array.from(node.attributes).map(({ name, value }) =>
      value ? `[${name}="${value}"]` : ``
    ),
  ].join(``);
}

export function hasDescendant(parent: Node, target: Node): boolean {
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
  return false;
}

export function parse(
  string: string,
  contentType: DOMParserSupportedType
): Document {
  if (Buffer.isBuffer(string)) {
    string = string.toString();
  }

  const dom = new globalThis.window.DOMParser().parseFromString(
    string,
    contentType
  );
  const child = dom.firstElementChild;
  if (child !== null && child.matches('parsererror')) {
    throw new Error(child.textContent || '');
  }
  return dom;
}

export function isSelector(thing: unknown): thing is string {
  return typeof thing === 'string' && !isHtml(thing);
}
export function isHtml(thing: unknown): thing is string {
  return typeof thing === 'string' && /^\s*<\w.*?>/.test(thing);
}

const NAMESPACES = Object.assign(Object.create(null), {
  xml: 'http://www.w3.org/XML/1998/namespace',
  xmlns: 'http://www.w3.org/2000/xmlns/',
});
export function lookupNamespaceURI(
  prefix: string,
  document?: Document
): string {
  [prefix] = prefix.split(':');
  return (
    NAMESPACES[prefix.toLowerCase()] ||
    (document && document.lookupNamespaceURI(prefix))
  );
}
