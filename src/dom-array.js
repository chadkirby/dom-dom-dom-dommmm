const DOM = require('./dom');
const CSS = require('./css-adapter');

const { attr, closest, createTextNode, empty, hasDescendant, isHtml, isSelector, lookupNamespaceURI, nextElementSiblings, nextSiblings, nodeToSelector, parentsUntil, previousElementSiblings, previousSiblings, unwrap } = require('./helpers');
const { isTextNode, isEl } = require('./is-node');
const { removeSubsets } = require('./remove-subsets');

const contentTypes = Object.assign(Object.create(null), {
  xml: 'text/xml',
  html: 'text/html'
});

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
  addClass(className) {
    for (const el of this) {
      el.classList.add(className);
    }
    return this;
  }
  removeClass(className) {
    for (const el of this) {
      el.classList.remove(className);
      if (!el.classList.length) {
        el.removeAttribute('class');
      }
    }
    return this;
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
      if (/\w+:\w+/.test(name)) {
        throw new Error('use setAttrNS() to set namespaced attributes');
      }
      this.forEach((el) => el.setAttribute(name, value));
    }
    return first.getAttribute(name);
  }
  setAttrNS(name, value) {
    let [ prefix ] = name.split(':');
    let { document } = this;
    let uri = lookupNamespaceURI(prefix, document);
    for (const el of this) {
      if (el) {
        el.setAttributeNS(uri, name, value);
      }
    }
    return this;
  }
  defineNamespace(prefix, uri) {
    for (const el of this) {
      if (el) {
        let name = `xmlns:${prefix}`;
        el.setAttributeNS(lookupNamespaceURI(name), name, uri);
      }
    }
    return this;
  }
  // jq
  before(content) {
    return each(this, `before`, content);
  }
  children(selector) {
    return getSet(this, (el) => el.children).filter(selector);
  }
  clone({ deep = true } = {}) {
    return this.constructor.from(
      this,
      (el) => el.cloneNode(deep)
    );
  }
  // jq
  closest(target) {
    let matcher = (el) => this.constructor.of(el).is(target);
    return getSet(this, (item) => closest(item, matcher));
  }
  // jq
  contents() {
    return getSet(this, (el) => el.childNodes);
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
      empty(el);
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
      return this.constructor.from(
        this.arrayFilter((el, i) => target.call(el, i, el))
      );
    }
    throw new Error('unknown find target');
  }

  findFirst(target) {
    if (isSelector(target)) {
      return this.query(target);
    }
    if (typeof target === 'function') {
      return this.constructor.of(
        this.arrayFind((el, i) => target.call(el, i, el))
      );
    }
    throw new Error('unknown findFirst target');
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
        if (el) {
          el.innerHTML = str;
        }
      }
      return this;
    }
    return this
      .arrayFilter((el) => el)
      .arrayMap((el) => el.innerHTML || el.textContent)
      .join(``);
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

  // Filters the list to those whose text matches the given target
  matches(target, getText = (el) => el.textContent) {
    return this.arrayFilter((el, i) => getText(el, i, this).match(target));
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
    return getSet(this, (el) => el.nextElementSibling).filter(selector);
  }
  nextSibling(selector) {
    return getSet(this, (el) => el.nextSibling).filter(selector);
  }
  nextSiblings(selector) {
    return getSet(this, nextSiblings).filter(selector);
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
    if (isEl(target)) {
      return this.arrayFilter((el) => el !== target);
    }
    if (Array.isArray(target)) {
      return this.arrayFilter((el) => !target.includes(el));
    }
    if (typeof target === 'function') {
      return this.arrayFilter((el, i) => !target.call(el, i, el));
    }
    throw new Error('unknown not target');
  }
  parent(selector) {
    return getSet(this, (el) => el.parentElement).filter(selector);
  }
  // jq
  parents(selector) {
    return getSet(this, (el) => parentsUntil(el, () => false)).filter(selector);
  }
  // jq
  parentsUntil(target, filter) {
    return getSet(this, (el) => parentsUntil(el, target)).filter(filter);
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
    return getSet(this, (el) => el.previousElementSibling).filter(selector);
  }
  previousSiblings(selector) {
    return getSet(this, previousSiblings).filter(selector);
  }
  previousSibling(selector) {
    return getSet(this, (el) => el.previousSibling).filter(selector);
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
    if (newText || newText === '') {
      for (const el of this) {
        if (el) {
          if (isEl(el)) {
            empty(el);
            el.append(createTextNode(newText));
          } else if (isTextNode(el)) {
            el.textContent = newText;
          }
        }
      }
      return this;
    }
    return this
      .arrayFilter((el) => el)
      .arrayMap((el) => el.textContent)
      .join(``);
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

function getSet(domArray, getter) {
  let set = new Set();
  for (const el of domArray) {
    let result = getter(el);
    if (result) {
      if (!result[Symbol.iterator] || typeof result === 'string') {
        result = [ result ];
      }
      for (const item of result) {
        set.add(item);
      }
    }
  }
  return domArray.constructor.from(set);

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
