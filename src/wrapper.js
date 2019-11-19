const { attr, closest, createElement, nextSiblings, parentsUntil, previousSiblings } = require('./helpers');
const globalThis = require('globalthis')();
const window = globalThis.window || globalThis.JSDOM_WINDOW;

class DOMArray extends Array {
  // jq
  after(...items) {
    for (const el of this) {
      el.after(...items.map(mapHandler(el)));
    }
    return this;
  }
  // jq
  append(...items) {
    for (const el of this) {
      el.append(...items.map(mapHandler(el)));
    }
    return this;
  }
  // jq
  attr(name, value) {
    let [ first ] = this;
    if (!name) {
      return attr(first);
    }
    if (value !== undefined) {
      this.forEach((el) => el.setAttribute(name, value));
    }
    return first.getAttribute(name);
  }
  get attribs() {
    let self = this;
    return new Proxy(this.attr(), {
      set(attribs, prop, value) {
        attribs[prop] = value;
        self.attr(prop, value);
        return true;
      }
    });
  }
  // jq
  closest(selector) {
    let [ first ] = this;
    let ancestor = closest(first, selector);
    return ancestor ? DOMArray.of(ancestor) : DOMArray.of();
  }
  // jq
  contents() {
    return DOMArray.from(this[0].childNodes);
  }
  eq(index) {
    return DOMArray.of(this[index]);
  }
  // jq
  filter(target) {
    return super.filter(
      (el) => DOMArray.of(el).is(target)
    );
  }
  // jq
  find(selector) {
    let out = DOMArray.of();
    for (const el of this) {
      out.push(...el.querySelectorAll(selector));
    }
    return out;
  }
  // array
  findIndex(target) {
    if (target instanceof DOMArray) {
      [ target ] = target;
    }
    return super.findIndex((el) => el === target);
  }
  findOne(selector) {
    for (const el of this) {
      let found = el.querySelector(selector);
      if (found) {
        return DOMArray.of(found);
      }
    }
    return DOMArray.of();
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
  has(target) {
    return this.filter((el) => el.querySelector(target));
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
  index(item) {
    return this.findIndex(item);
  }
  is(target) {
    return super.find((el, i) => {
      if (target instanceof DOMArray) {
        [ target ] = target;
      }
      if (isNode(target)) {
        return el === target;
      } else if (typeof target === `string`) {
        return el.matches && el.matches(target);
      } else if (typeof target === `function`) {
        return target(el, i, this);
      }
    });
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
    let [ { nextElementSibling: nextEl } = {} ] = this;
    let next = nextEl ? DOMArray.of(nextEl) : DOMArray.of();
    return target ? next.filter(target) : next;
  }
  // jq
  nextAll(target) {
    let sibs = DOMArray.from(nextSiblings(this[0]));
    return target ? sibs.filter(target) : sibs;
  }
  not(target) {
    if (typeof target === `string`) {
      return this.filter(target);
    }
    if (target instanceof DOMArray) {
      [ target ] = target;
    }
    if (isNode(target)) {
      return this.filter((el) => el !== target);
    }
  }
  // jq
  parentsUntil(target) {
    return DOMArray.from(parentsUntil(this[0], target));
  }

  // jq
  prepend(...items) {
    for (const el of this) {
      el.prepend(...items.map(mapHandler(el)));
    }
    return this;
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
    let [ { previousElementSibling: prevEl } = {} ] = this;
    let prev = prevEl ? DOMArray.of(prevEl) : DOMArray.of();
    return target ? prev.filter(target) : prev;
  }
  // jq
  prevAll(target) {
    let sibs = DOMArray.from(previousSiblings(this[0]));
    return target ? sibs.filter(target) : sibs;
  }

  //jq
  replaceWith(content) {
    let newContents = this.map(() => isNode(content) ? content : createElement(content));
    for (const [ i, el ] of this.entries()) {
      el.replaceWith(newContents[i]);
    }
    return newContents;
  }
  // jq
  siblings(target) {
    return DOMArray.from([
      ...this.prevAll(target).reverse(),
      ...this.nextAll(target)
    ]);
  }

  text() {
    return this.map((el) => el.textContent).join(``);
  }

  toArray() {
    return Array.from(this);
  }
}

function mapHandler(el) {
  return (item, i, items) => {
    if (isNode(item)) {
      return item;
    }
    if (typeof item === `string`) {
      return createElement(item);
    }
    if (typeof item === `function`) {
      return item(el, i, items);
    }
  };
}

function $(arg) {
  if (isNode(arg)) {
    return DOMArray.of(arg);
  }
  if (typeof arg === `string`) {
    return DOMArray.of(createElement(arg));
  }
}

function isElement(thing) {
  return thing instanceof window.Element;
}

function isNode(thing) {
  return thing instanceof window.Node;
}

module.exports = {
  $
};
