const DOM = require('./dom');
const CSS = require('./css-adapter');

const { attr, closest, createElement, createFragment, createTextNode, hasDescendant, isHtml, isSelector, nextElementSiblings, nextSiblings, nodeToSelector, parentsUntil, previousElementSiblings, previousSiblings, unwrap } = require('./helpers');
const { isTextNode, isEl } = require('./is-node');
const { removeSubsets } = require('./remove-subsets');

class DOMArray extends Array {
  get DOMArray() {
    return true;
  }
  // jq
  add(content) {
    if (isSelector(content)) {
      let newElems = this.constructor.cssSelectAll([ DOM.document.body ], content);
      return this.concat(newElems);
    }
    if (isHtml(content)) {
      let newElems = [ ...createFragment(content, DOM.document).childNodes ];
      return this.concat(newElems);
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
  ancestors() {
    let { constructor: PROTO } = this;
    if (this.length) {
      return PROTO.from(parentsUntil(this[0], () => false));
    }
    return PROTO.of();
  }

  // jq
  append(content) {
    return each(this, `append`, content);
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
      return {};
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
    if (this.length) {
      let [ first ] = this;
      let children = this.constructor.from(first.children);
      return children.filter(selector);
    }
    return this.constructor.of();
  }
  clone(deep = true) {
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

  css(property) {
    if (this.length) {
      return DOM.window.getComputedStyle(this[0]).getPropertyValue(property);
    }
    return ``;
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
  outerHtml() {
    return this.arrayMap(
      (el) => el.outerHTML || el.textContent
    ).join(``);
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
   * Gets the next sibling of the first selected element, optionally filtered by
   * a selector.
   *
   * @param {string} [selector] - If specified filter for sibling.
   *
   * @see {@link http://api.jquery.com/next/}
   */
  next(selector) {
    let { constructor: PROTO } = this;
    let [ { nextElementSibling: nextEl } = {} ] = this;
    let next = nextEl ? PROTO.of(nextEl) : PROTO.of();
    return next.filter(selector);
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
  // jq
  nextAll(selector) {
    let sibs = this.constructor.from(nextElementSiblings(this[0]));
    return sibs.filter(selector);
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
  parentsUntil(target) {
    return this.ancestors().sliceUntil(target);
  }

  // jq
  prepend(content) {
    return each(this, `prepend`, content);
  }
  /**
   * Gets the prev sibling of the first selected element, optionally filtered by
   * a selector.
   *
   * @param {string} [selector] - If specified filter for sibling.
   *
   * @see {@link http://api.jquery.com/prev/}
   */
  prev(selector) {
    let { constructor: PROTO } = this;
    let [ { previousElementSibling: prevEl } = {} ] = this;
    let prev = prevEl ? PROTO.of(prevEl) : PROTO.of();
    return prev.filter(selector);
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

  // jq
  prevAll(selector) {
    let sibs = this.constructor.from(previousElementSiblings(this[0]));
    return sibs.filter(selector);
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
      let wrapper = thingToNode(target, el.ownerDocument);
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

function each(domArray, op, content) {
  for (const el of domArray) {
    if (Array.isArray(content)) {
      el[op](
        ...Array.from(content)
          .map((item) => thingToNode(item, el.ownerDocument))
          .filter((x) => x)
      );
    } else {
      let node = thingToNode(content, el.ownerDocument);
      if (node) {
        el[op](node);
      }
    }
  }
  return domArray;
}

function thingToNode(thing, doc) {
  if (Array.isArray(thing)) {
    [ thing ] = thing;
  }
  if (isEl(thing) || isTextNode(thing)) {
    return thing;
  }
  if (typeof thing === `string`) {
    return createElement(thing, doc) || createTextNode(thing, doc);
  }
  if (typeof thing === `function`) {
    return thing(doc);
  }
}

module.exports = {
  DOMArray
};
