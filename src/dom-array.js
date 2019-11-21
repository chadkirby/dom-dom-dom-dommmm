const { attr, closest, createElement, createTextNode, nextSiblings, parentsUntil, previousSiblings } = require('./helpers');
const { cssIs, cssSelectAll, cssSelectOne } = require('./css-select');
const { isNode } = require('./is-node');

class DOMArray extends Array {
  get DOMArray() {
    return true;
  }
  // jq
  after(content) {
    return each(this, `after`, content);
  }
  // jq
  append(content) {
    return each(this, `append`, content);
  }
  // jq
  attr(name, value) {
    if (!this.length) {
      return null;
    }
    let [ first ] = this;
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
  children(target) {
    if (this.length) {
      let [ first ] = this;
      let children = this.constructor.from(first.children);
      return target ? children.domFilter(target) : children;
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
  eq(index) {
    if (index < 0) {
      index += this.length;
    }
    if (index >= 0 && index < this.length) {
      return this.constructor.of(this[index]);
    }
    return this.constructor.of();
  }

  domFilter(target) {
    if (typeof target === `function`) {
      return super.filter(target);
    }
    return super.filter(
      (el) => this.constructor.of(el).is(target)
    );
  }
  filter(target) {
    return super.filter(target);
  }
  find(target) {
    return super.find(target);
  }
  // jq
  first() {
    return this.slice(0, 1);
  }
  // jq
  last() {
    return this.slice(-1);
  }
  // jq
  has(selector) {
    return this.domFilter((el) => cssSelectOne(el, selector));
  }
  // jq
  html(str) {
    let [ el ] = this;
    if (el && str) {
      el.innerHTML = str;
    }
    return el ? el.innerHTML : ``;
  }
  // jq
  index(target) {
    if (DOMArray.isDOMArray(target)) {
      [ target ] = target;
    }
    return this.findIndex((el) => el === target);
  }
  is(target) {
    if (DOMArray.isDOMArray(target)) {
      [ target ] = target;
    }
    let finder = target;
    if (isNode(target)) {
      finder = (el) => el === target;
    } else if (typeof target === `string`) {
      finder = (el) => cssIs(el, target);
    }
    return super.find(finder);
  }
  /**
   * Gets the next sibling of the first selected element, optionally filtered by
   * a selector.
   *
   * @param {string} [selector] - If specified filter for sibling.
   *
   * @see {@link http://api.jquery.com/next/}
   */
  next(target) {
    let { constructor: DArr } = this;
    let [ { nextElementSibling: nextEl } = {} ] = this;
    let next = nextEl ? DArr.of(nextEl) : DArr.of();
    return target ? next.domFilter(target) : next;
  }
  // jq
  nextAll(target) {
    let sibs = this.constructor.from(nextSiblings(this[0]));
    return target ? sibs.domFilter(target) : sibs;
  }
  not(target) {
    if (typeof target === `string`) {
      return this.domFilter(
        (el) => !this.constructor.of(el).is(target)
      );
    }
    if (typeof target === `function`) {
      return this.domFilter((el) => !target(el));
    }
    if (DOMArray.isDOMArray(target)) {
      [ target ] = target;
    }
    if (isNode(target)) {
      return this.domFilter((el) => el !== target);
    }
  }
  parent() {
    if (this.length) {
      return this.constructor.of(this[0].parentNode);
    }
    return this.constructor.of();
  }
  // jq
  parentsUntil(target) {
    let { constructor: PROTO } = this;
    if (this.length) {
      return PROTO.from(parentsUntil(this[0], (el) => PROTO.of(el).is(target)));
    }
    return PROTO.of();
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
  prev(target) {
    let { constructor: DArr } = this;
    let [ { previousElementSibling: prevEl } = {} ] = this;
    let prev = prevEl ? DArr.of(prevEl) : DArr.of();
    return target ? prev.domFilter(target) : prev;
  }
  // jq
  prevAll(target) {
    let sibs = this.constructor.from(previousSiblings(this[0]));
    return target ? sibs.domFilter(target) : sibs;
  }
  prevUntil(target) {
    let prevSibs = this.prevAll();
    if (target) {
      let stop = prevSibs.findIndex((el) => cssIs(el, target));
      if (stop > -1) {
        return prevSibs.slice(0, stop);
      }
    }
    return prevSibs;
  }

  query(target) {
    let { constructor: PROTO } = this;
    let found = cssSelectOne(this, target);
    return found ? PROTO.of(found) : PROTO.of();
  }
  queryAll(target) {
    return this.constructor.from(cssSelectAll(this, target));
  }
  queryFilter(target) {
    if (typeof target === `function`) {
      return super.filter(target);
    }
    return super.filter(
      (el) => this.constructor.of(el).is(target)
    );
  }

  remove() {
    for (const el of this) {
      el.remove();
    }
    return this;
  }
  //jq
  replaceWith(content) {
    return each(this, `replaceWith`, content);
  }
  // jq
  siblings(target) {
    return this.constructor.from([
      ...this.prevAll(target).reverse(),
      ...this.nextAll(target)
    ]);
  }

  text(newText) {
    if (newText !== undefined) {
      this.forEach((el) => {
        el.innerHTML = ``;
        el.append(createTextNode(newText, el.ownerDocument));
      });
    }
    return this.map((el) => el.textContent).join(``);
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

  static isDOMArray(thing) {
    return thing instanceof DOMArray;
  }
}

function each(domArray, op, content) {
  for (const el of domArray) {
    let { ownerDocument: document } = el;
    if (Array.isArray(content)) {
      el[op](
        ...content
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
  if (isNode(thing)) {
    return thing;
  }
  if (typeof thing === `string`) {
    return createElement(thing, document);
  }
  if (typeof thing === `function`) {
    return thing(document);
  }

}

module.exports = {
  DOMArray
};
