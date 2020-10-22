const { window } = require('./dom');

const { attr, closest, createElement, createTextNode, hasDescendant, nextSiblings, nodeToSelector, parentsUntil, previousSiblings, unwrap } = require('./helpers');
const { cssIs, cssSelectAll, cssSelectOne } = require('./css-select');
const { isTextNode, isEl } = require('./is-node');

class DOMArray extends Array {
  get DOMArray() {
    return true;
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
      return window.getComputedStyle(this[0]).getPropertyValue(property);
    }
    return ``;
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
    let { constructor: PROTO } = this;
    if (typeof target === 'string') {
      return PROTO.from(super.filter((el) => cssIs(el, target)));
    }
    if (typeof target === 'function') {
      let cb = target.bind(this);
      return PROTO.from(super.filter((el, i) => cb(i, el)));
    }
    throw new Error('unknown filter target');
  }

  find(target) {
    if (typeof target === 'string') {
      return this.queryAll(target);
    }
    if (typeof target === 'function') {
      let cb = target.bind(this);
      return this.constructor.from(
        super.find((el, i) => cb(i, el))
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
  hasNode(node) {
    if (Array.isArray(node)) {
      [ node ] = node;
    }
    return this.filter((i, el) => hasDescendant(el, node));
  }
  // Filters the list to those with a descendant that matches the given
  // selector.
  hasSelector(selector) {
    return this.filter((i, el) => cssSelectOne(el, selector));
  }
  // jq
  html(str) {
    if (str !== undefined) {
      for (const el of this) {
        el.innerHTML = str;
      }
      return this;
    }
    return this.map((el) => el.innerHTML || el.textContent).join(``);
  }
  outerHtml() {
    return this.map(
      (el) => el.outerHTML || el.textContent
    ).join(``);
  }
  // jq
  index(target) {
    if (Array.isArray(target)) {
      [ target ] = target;
    }
    return super.findIndex((el) => el === target);
  }
  is(target) {
    if (Array.isArray(target)) {
      return Boolean([ ...target ].find(((t) => this.is(t))));
    }
    let finder = target;
    if (isEl(target) || isTextNode(target)) {
      finder = (el) => target.isEqualNode(el);
    } else if (typeof target === 'string') {
      finder = (el) => cssIs(el, target);
    }
    return Boolean(super.find(finder));
  }
  get isTextNode() {
    return this.length && isTextNode(this[0]);
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
    let { constructor: DArr } = this;
    let [ { nextElementSibling: nextEl } = {} ] = this;
    let next = nextEl ? DArr.of(nextEl) : DArr.of();
    return next.filter(selector);
  }
  // jq
  nextAll(selector) {
    let sibs = this.constructor.from(nextSiblings(this[0]));
    return sibs.filter(selector);
  }
  nextUntil(target) {
    return this.nextAll().sliceUntil(target);
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
    let { constructor: DArr } = this;
    let [ { previousElementSibling: prevEl } = {} ] = this;
    let prev = prevEl ? DArr.of(prevEl) : DArr.of();
    return prev.filter(selector);
  }
  // jq
  prevAll(selector) {
    let sibs = this.constructor.from(previousSiblings(this[0]));
    return sibs.filter(selector);
  }

  prevUntil(target) {
    return this.prevAll().sliceUntil(target);
  }

  query(selector) {
    let { constructor: PROTO } = this;
    let found = cssSelectOne(this, selector);
    return found ? PROTO.of(found) : PROTO.of();
  }
  queryAll(selector) {
    return this.constructor.from(cssSelectAll(this, selector));
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
      let stop = super.findIndex((el) => PROTO.of(el).is(target));
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
    return this.map((el) => el.textContent).join(``);
  }

  unwrap() {
    for (const el of this) {
      unwrap(el);
    }
    return this;
  }

  without(selector) {
    return super.filter((el) => !cssIs(el, selector));
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
    return this.map(nodeToSelector).join(`,`);
  }

  static isDOMArray(thing) {
    return thing instanceof DOMArray;
  }
}

function each(domArray, op, content) {
  for (const el of domArray) {
    let { ownerDocument: document } = el;
    if (Array.isArray(content)) {
      el[op](
        ...Array.from(content)
          .map((item) => thingToNode(item, document))
          .filter((x) => x)
      );
    } else {
      let node = thingToNode(content, document);
      if (node) {
        el[op](node);
      }
    }
  }
  return domArray;
}

function thingToNode(thing, document) {
  if (Array.isArray(thing)) {
    [ thing ] = thing;
  }
  if (isEl(thing) || isTextNode(thing)) {
    return thing;
  }
  if (typeof thing === `string`) {
    return createElement(thing, document) || createTextNode(thing, document);
  }
  if (typeof thing === `function`) {
    return thing(document);
  }

}

module.exports = {
  DOMArray
};
