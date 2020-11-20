const DOM = require('./dom');
const CSS = require('./css-adapter');

const { attr, closest, createTextNode, hasDescendant, isHtml, isSelector, nextElementSiblings, nextSiblings, nodeToSelector, parentsUntil, previousElementSiblings, previousSiblings, unwrap } = require('./helpers');
const { isTextNode, isEl } = require('./is-node');
const { removeSubsets } = require('./remove-subsets');

const contentTypes = {
  xml: 'text/xml',
  html: 'text/html'
};

class DOMArray extends Array {
  get DOMArray() {
    return true;
  }
  static get document() {
    return DOM.document;
  }
  get document() {
    return this.length ? this[0].ownerDocument : this.constructor.document;
  }
  static fromHtml(html, document = this.document) {
    let div = document.createElement('div');
    try {
      if (document.contentType === contentTypes.xml) {
        // add the div to the DOM so it will inherit the
        // document's namespaces
        document.firstElementChild.append(div);
      }
      div.innerHTML = html;
      return this.from(div.childNodes);
    } finally {
      div.remove();
    }
  }
  // jq
  add(content) {
    if (isSelector(content)) {
      let newElems = this.constructor.cssSelectAll([ this.document.body ], content);
      return this.concat(newElems);
    }
    if (isHtml(content)) {
      return this.concat(this.constructor.fromHtml(content));
    }
    if (isEl(content) || Array.isArray(content)) {
      return this.concat(content);
    }
    throw new Error(`can't add content`);
  }
  addClass(_class) {
    for (const el of this) {
      el.classList.add(_class);
    }
  }
  // jq
  after(content) {
    return each(this, `after`, content);
  }

  // jq
  append(...contents) {
    for (const content of contents) {
      each(this, `append`, content);
    }
    return this;
  }
  // jq
  prepend(...contents) {
    for (const content of contents) {
      each(this, `prepend`, content);
    }
    return this;
  }

  arrayFilter(...args) {
    return super.filter(...args);
  }

  arrayFind(...args) {
    return super.find(...args);
  }

  arrayMap(...args) {
    return super.map(...args);
  }

  // jq
  attr(name, value) {
    let [ first ] = this;
    if (!(first && first.getAttribute)) {
      return name ? null : {};
    }
    if (!name) {
      return attr(first);
    }
    if (value !== undefined) {
      this.forEach((el) => el.setAttribute(name, value));
    }
    return first.getAttribute(name);
  }
  // jq
  before(content) {
    return each(this, `before`, content);
  }
  children(selector) {
    let children = new Set();
    for (const el of this) {
      for (const child of el.children) {
        children.add(child);
      }
    }
    return this.constructor.from(children).filter(selector);
  }
  clone({ deep = true } = {}) {
    return this.constructor.from(
      this,
      (el) => el.cloneNode(deep)
    );
  }
  // jq
  closest(target) {
    let { constructor: PROTO } = this;
    if (this.length) {
      let ancestor = closest(this[0], (el) => PROTO.of(el).is(target));
      return ancestor ? PROTO.of(ancestor) : PROTO.of();
    }
    return PROTO.of();
  }
  // jq
  contents() {
    if (this.length) {
      return this.constructor.from(this[0].childNodes);
    }
    return this.constructor.of();
  }

  // Get the value of a computed style property for the
  // first element in the set of matched elements or set one
  // or more CSS properties for every matched element.
  css(propertyName, value) {
    if (!propertyName) {
      return this[0].style;
    }
    if (value) {
      for (const { style } of this) {
        style[propertyName] = value;
      }
      return this;
    }
    if (!this.length) {
      return ``;
    }
    return this[0].style.getPropertyValue(propertyName);
  }

  each(fn) {
    super.forEach((el, i, arr) => fn.call(el, i, el, arr));
    return this;
  }

  // jq
  empty() {
    for (const el of this) {
      while (el.firstChild) {
        el.firstChild.remove();
      }
    }
    return this;
  }

  eq(index) {
    if (index < 0) {
      index += this.length;
    }
    if (index >= 0 && index < this.length) {
      return this.constructor.of(this[index]);
    }
    return this.constructor.of();
  }

  filter(target) {
    if (!target) {
      return this;
    }
    if (isSelector(target)) {
      return this.arrayFilter((el) => this.constructor.cssIs(el, target));
    }
    if (typeof target === 'function') {
      return this.arrayFilter((el, i) => target.call(el, i, el));
    }
    throw new Error('unknown filter target');
  }

  find(target) {
    if (isSelector(target)) {
      return this.queryAll(target);
    }
    if (typeof target === 'function') {
      return this.constructor.of(
        this.arrayFind((el, i) => target.call(el, i, el))
      );
    }
    throw new Error('unknown find target');
  }

  // jq
  first() {
    return this.slice(0, 1);
  }
  // jq
  last() {
    return this.slice(-1);
  }
  // Filters the list to those with the given dom node as a descendant
  has(thing) {
    if (isSelector(thing)) {
      // Filter the list to those with a descendant that matches the
      // given selector.
      let { constructor: PROTO } = this;
      return this.filter((i, el) => PROTO.cssSelectOne([ el ], thing));
    }
    if (Array.isArray(thing)) {
      [ thing ] = thing;
    }
    return this.filter((i, el) => hasDescendant(el, thing));
  }
  // jq
  html(str) {
    if (str !== undefined) {
      for (const el of this) {
        el.innerHTML = str;
      }
      return this;
    }
    return this.arrayMap((el) => el.innerHTML || el.textContent).join(``);
  }
  xml({ delimiter = '' } = {}) {
    return this.arrayMap((el) => {
      let s = new DOM.window.XMLSerializer();
      return s.serializeToString(el);
    }).join(delimiter);
  }
  outerHtml(delimiter = '') {
    return this.arrayMap(
      (el) => el.outerHTML || el.textContent
    ).join(delimiter);
  }
  // jq
  index(target) {
    if (Array.isArray(target)) {
      [ target ] = target;
    }
    return this.findIndex((el) => el === target);
  }
  is(target) {
    if (Array.isArray(target)) {
      return Boolean([ ...target ].find(((t) => this.is(t))));
    }
    let finder = target;
    if (isEl(target) || isTextNode(target)) {
      finder = (el) => target === el;
    } else if (isSelector(target)) {
      finder = (el) => this.constructor.cssIs(el, target);
    } else {
      throw new Error('unknown is target');
    }
    return Boolean(this.arrayFind(finder));
  }
  get isTextNode() {
    return this.length && isTextNode(this[0]);
  }

  map(callback) {
    return this.arrayMap((el, i) => callback.call(el, i, el));
  }

  /**
   *  Get the immediately following sibling of each element
   *  in the set of matched elements. If a selector is
   *  provided, it retrieves the next sibling only if it
   *  matches that selector.
   *
   * @param {string} [selector] - If specified filter for
   * sibling.
   *
   * @see {@link http://api.jquery.com/next/}
   */
  next(selector) {
    return this
      .arrayMap((el) => el.nextElementSibling)
      .arrayFilter((el) => el)
      .filter(selector);
  }
  nextSibling(selector) {
    let [ { nextSibling } ] = this;
    if (nextSibling) {
      let sib = this.constructor.of(nextSibling);
      return sib.filter(selector);
    }
    return this.constructor.from([]);
  }
  nextSiblings(selector) {
    let sibs = this.constructor.from(nextSiblings(this[0]));
    return sibs.filter(selector);
  }
  // jq: Get all following siblings of each element in the
  // set of matched elements, optionally filtered by a
  // selector.
  nextAll(selector) {
    let sibsList = this.constructor.of().concat(
      ...this.arrayMap((el) => [ ...nextElementSiblings(el) ])
    );
    return sibsList.arrayFilter((el) => el).filter(selector);
  }

  nextUntil(target) {
    return this.nextAll().sliceUntil(target);
  }
  not(target) {
    if (isSelector(target)) {
      return this.arrayFilter((el) => !this.constructor.cssIs(el, target));
    }
    if (typeof target === 'function') {
      return this.arrayFilter((el, i) => !target.call(el, i, el));
    }
    throw new Error('unknown not target');
  }
  parent() {
    if (this.length) {
      return this.constructor.of(this[0].parentNode);
    }
    return this.constructor.of();
  }
  // jq
  parents(selector) {
    let parents = new Set();
    for (const el of this) {
      for (const parent of parentsUntil(el, () => false)) {
        parents.add(parent);
      }
    }
    return this.constructor.from(parents).filter(selector);
  }
  // jq
  parentsUntil(target, filter) {
    let parents = new Set();
    for (const el of this) {
      for (const parent of parentsUntil(el, target)) {
        parents.add(parent);
      }
    }
    return this.constructor.from(parents).filter(filter);
  }

  /**
   * Get the immediately preceding sibling of each element
   * in the set of matched elements. If a selector is
   * provided, it retrieves the previous sibling only if it
   * matches that selector.
   *
   * @param {string} [selector] - If specified filter for
   * sibling.
   *
   * @see {@link http://api.jquery.com/prev/}
   */
  prev(selector) {
    return this
      .arrayMap((el) => el.previousElementSibling)
      .arrayFilter((el) => el)
      .filter(selector);
  }
  previousSiblings(selector) {
    let sibs = this.constructor.from(previousSiblings(this[0]));
    return sibs.filter(selector);
  }
  previousSibling(selector) {
    let [ { previousSibling } ] = this;
    if (previousSibling) {
      let sib = this.constructor.of(previousSibling);
      return sib.filter(selector);
    }
    return this.constructor.from([]);
  }

  // Get all preceding siblings of each element in the set
  // of matched elements, optionally filtered by a selector.
  prevAll(selector) {
    let sibsList = this.constructor.of().concat(
      ...this.arrayMap((el) => [ ...previousElementSiblings(el) ])
    );
    return sibsList.arrayFilter((el) => el).filter(selector);
  }

  prevUntil(target) {
    return this.prevAll().sliceUntil(target);
  }

  query(selector) {
    let { constructor: PROTO } = this;
    let found = PROTO.cssSelectOne(this, selector);
    return found ? PROTO.of(found) : PROTO.of();
  }
  queryAll(selector) {
    return this.constructor.from(this.constructor.cssSelectAll(this, selector));
  }

  remove() {
    for (const el of this) {
      el.remove();
    }
    return this;
  }
  removeAttr(name) {
    for (const el of this) {
      el.removeAttribute(name);
    }
    return this;
  }
  //jq
  replaceWith(content) {
    return each(this, `replaceWith`, content);
  }

  // jq
  siblings(selector) {
    return this.constructor.from([
      ...this.prevAll(selector).reverse(),
      ...this.nextAll(selector)
    ]);
  }

  sliceUntil(target) {
    let { constructor: PROTO } = this;
    if (target) {
      let stop = this.findIndex((el) => PROTO.of(el).is(target));
      if (stop > -1) {
        return this.slice(0, stop);
      }
    }
    return this;
  }

  text(newText) {
    if (newText || newText === ``) {
      for (const el of this) {
        el.textContent = newText;
      }
      return this;
    }
    return this.arrayMap((el) => el.textContent).join(``);
  }

  unwrap() {
    for (const el of this) {
      unwrap(el);
    }
    return this;
  }

  without(selector) {
    return this.arrayFilter((el) => !this.constructor.cssIs(el, selector));
  }

  wrap(target) {
    for (const el of this) {
      let wrapper = thingToNode(target, this);
      el.replaceWith(wrapper);
      wrapper.append(el);
    }
  }

  toArray() {
    return Array.from(this);
  }

  toSelector() {
    return this.arrayMap(nodeToSelector).join(`,`);
  }

  static isDOMArray(thing) {
    return thing instanceof DOMArray;
  }

  static cssSelectAll(nodes, selector) {
    return CSS.cssSelectAll(removeSubsets(nodes), selector);
  }
  static cssSelectOne(nodes, selector) {
    return CSS.cssSelectOne(removeSubsets(nodes), selector);
  }
  static cssIs(node, selector) {
    return CSS.cssIs(node, selector);
  }
}

function each(domArray, op, val) {
  for (const el of domArray) {
    let content = val;
    if (isHtml(content)) {
      content = domArray.constructor.fromHtml(content);
      if (content.length === 1) {
        [ content ] = content;
      }
    }
    if (Array.isArray(content)) {
      el[op](
        ...Array.from(content)
          .map((item) => thingToNode(item, domArray))
          .filter((x) => x)
      );
    } else {
      let node = thingToNode(content, domArray);
      if (node) {
        el[op](node);
      }
    }
  }
  return domArray;
}

function thingToNode(thing, domArray) {
  if (Array.isArray(thing)) {
    [ thing ] = thing;
  }
  if (isEl(thing) || isTextNode(thing)) {
    return thing;
  }
  if (isHtml(thing)) {
    return domArray.constructor.fromHtml(thing)[0];
  }
  if (typeof thing === `string`) {
    return createTextNode(thing, domArray.document);
  }
  if (typeof thing === `function`) {
    return thing(domArray.document);
  }
}

module.exports = {
  DOMArray,
  contentTypes
};
