/// <reference lib="dom" />
import { CssAdapter as CSS } from './css-adapter.js';

import {
  attr,
  closest,
  createTextNode,
  empty,
  hasDescendant,
  isHtml,
  isSelector,
  lookupNamespaceURI,
  nextElementSiblings,
  nextSiblings,
  nodeToSelector,
  parentsUntil,
  parse,
  previousElementSiblings,
  previousSiblings,
  unwrap,
} from './helpers.js';
import { isTextNode, isEl, isNode } from './is-node.js';
import { removeSubsets } from './remove-subsets.js';

type sel = string;

export const contentTypes = Object.assign(Object.create(null), {
  xml: 'text/xml',
  html: 'text/html',
});

export type DOMTYPE = Node;

type FILTER_FN<T extends DOMTYPE> = (i: number, el: T, list: T[]) => boolean;
type AttrArgsGetOne = [string];
type AttrArgsSetOne = [string, string | number];
type AttrArgsSetRecord = [Record<string, string>];

type TARGET<T = DOMTYPE> =
  | DOMArray
  | T
  | T[]
  | string
  | ((value: DOMTYPE, index?: number, arr?: DOMTYPE[]) => boolean);

export type CONFIG = {
  document: Document;
  cssSelectAll(nodes: DOMTYPE[], selector: sel): Element[];
  cssSelectOne(nodes: DOMTYPE[], selector: sel): Element | null;
  cssIs(node: DOMTYPE, selector: sel): boolean;
};

export const defaultConfig: CONFIG = {
  get document() {
    return globalThis.document;
  },
  cssSelectAll(nodes: DOMTYPE[], selector: sel): Element[] {
    return CSS.cssSelectAll(removeSubsets(nodes), selector);
  },
  cssSelectOne(nodes: DOMTYPE[], selector: sel): Element | null {
    return CSS.cssSelectOne(removeSubsets(nodes), selector);
  },
  cssIs(node: DOMTYPE, selector: sel): boolean {
    return isEl(node) ? CSS.cssIs(node, selector) : false;
  },
};

function newDomArray<T extends DOMTYPE = DOMTYPE>(
  config: CONFIG,
  list: T[]
): DOMArray<T> {
  const domArray = new DOMArray(list, config);
  return new Proxy(domArray, {
    get(target, prop) {
      const i = Number(prop.toString());
      if (Number.isInteger(i)) {
        return target.nodeAt(i);
      } else {
        return target[prop as keyof DOMArray];
      }
    },
  });
}

export class DOMArray<T extends DOMTYPE = DOMTYPE> {
  ['constructor']!: typeof DOMArray;
  [index: number]: T | undefined;
  constructor(protected list: T[] = [], protected config = defaultConfig) {}

  static from<T extends DOMTYPE = DOMTYPE>(
    list: T[],
    config = defaultConfig
  ): DOMArray<T> {
    return newDomArray<T>(config, list);
  }
  static fromHtml(html: string, config = defaultConfig): DOMArray<Element> {
    const doc = parse(html, contentTypes.html);
    return newDomArray(config, [...doc.body.children]);
  }

  newFromList<NEWT extends DOMTYPE>(list: NEWT[]): DOMArray<NEWT> {
    return newDomArray<NEWT>(this.config, list);
  }

  newFromHtml(html: string): DOMArray<Element> {
    if (this.document?.contentType === contentTypes.xml) {
      return this.newFromXml(html);
    }
    const doc = parse(html, contentTypes.html);
    return newDomArray(this.config, [...doc.body.children]);
  }

  newFromXml(xml: string): DOMArray<Element> {
    let tmp = this.document?.createElement('div');
    if (tmp) {
      try {
        this.document?.documentElement.appendChild(tmp);
        tmp.innerHTML = xml;
        let $xml = newDomArray<Element>(this.config, [...tmp.children]);
        return $xml;
      } finally {
        tmp.remove();
      }
    }
    const doc = parse(xml, contentTypes.xml);
    return newDomArray(this.config, [...doc.documentElement.children]);
  }

  [Symbol.iterator](): Iterator<T> {
    return this.list[Symbol.iterator]();
  }
  concat(...args: T[]): DOMArray<T> {
    return this.newFromList<T>([...this.list, ...args]);
  }
  get length(): number {
    return this.list.length;
  }
  slice(start?: number, end?: number) {
    return this.newFromList<T>(this.list.slice(start, end));
  }

  splice(start: number, deleteCount?: number) {
    const deleted = this.list.splice(start, deleteCount);
    return this.newFromList<T>(deleted);
  }

  get DOMArray(): true {
    return true;
  }
  get document(): Document | undefined {
    const [el] = this.list;
    return isEl(el) ? el.ownerDocument : this.config.document;
  }
  // jq
  add(content: string): DOMArray<Node>;
  add(content: T | T[] | DOMArray<T>): DOMArray<T>;
  add(content: string | T | T[] | DOMArray<T>): DOMArray<T> | DOMArray<Node> {
    if (isSelector(content)) {
      const newElems = this.config.cssSelectAll(
        this.document ? [this.document.body] : [],
        content
      );
      return this.newFromList([...this.list, ...newElems]);
    }
    if (isHtml(content)) {
      return this.newFromList([
        ...this.list,
        ...this.newFromHtml(content).list,
      ]);
    }
    if (isEl(content)) {
      return this.newFromList([...this.list, content]);
    }
    if (Array.isArray(content)) {
      return this.newFromList([...this.list, ...content]);
    }
    if (DOMArray.isDOMArray(content)) {
      return this.newFromList([...this.list, ...content.list]);
    }
    throw new Error(`can't add content`);
  }
  addClass(className: string): DOMArray<T> {
    for (const el of this) {
      if (isEl(el)) el.classList.add(className);
    }
    return this;
  }
  removeClass(className: string): DOMArray<T> {
    for (const el of this) {
      if (isEl(el)) {
        el.classList.remove(className);
        if (!el.classList.length) {
          el.removeAttribute('class');
        }
      }
    }
    return this;
  }
  // jq
  after(content: Nodable): DOMArray<T> {
    return each(this, `after`, content);
  }

  // jq
  append(...contents: Nodable[]): DOMArray<T> {
    for (const content of contents) {
      each(this, `append`, content);
    }
    return this;
  }
  // jq
  prepend(...contents: Nodable[]): DOMArray<T> {
    for (const content of contents) {
      each(this, `prepend`, content);
    }
    return this;
  }

  arrayFilter(fn: (item: T, i: number, arr: T[]) => boolean): DOMArray<T> {
    const filtered = this.list.filter(fn);
    return this.newFromList(filtered);
  }

  arrayFind(
    predicate: (value: T, index: number, arr: T[]) => boolean,
    thisArg?: DOMArray
  ): T | undefined {
    return this.list.find(predicate, thisArg);
  }

  arrayMap<U>(
    callbackfn: (value: T, index: number, array: T[]) => U,
    thisArg?: unknown
  ): U[] {
    return this.list.map(callbackfn, thisArg);
  }

  // jq
  attr(): Record<string, string>; // get all
  attr(name: string): string | null; // get one
  attr(name: string, value: string | number): string; // set one
  attr(attrs: Record<string, string>): null; // set many
  attr(
    ...args: AttrArgsGetOne | AttrArgsSetOne | AttrArgsSetRecord
  ): Record<string, string> | string | null {
    const first = this[0];
    if (!args.length) {
      // return hash of attributes
      return isEl(first) ? attr(first) : {};
    }
    if (isEl(first)) {
      if (args.length === 1) {
        if (typeof args[0] === 'string') {
          let [name] = args as AttrArgsGetOne;
          return first.getAttribute(name);
        }
        let [attrs] = args as AttrArgsSetRecord;
        for (const [key, val] of Object.entries(attrs)) {
          this.attr(key, val);
        }
      } else {
        let [name, value] = args as AttrArgsSetOne;
        if (/\w+:\w+/.test(name)) {
          throw new Error('use setAttrNS() to set namespaced attributes');
        }
        this.forEach(
          (el) => isEl(el) && el.setAttribute(name, value.toString())
        );
      }
    }
    return null;
  }
  setAttrNS(name: string, value: string | number): DOMArray<T> {
    const [prefix] = name.split(':');
    const { document } = this;
    const uri = lookupNamespaceURI(prefix, document);
    for (const el of this) {
      if (isEl(el)) {
        el.setAttributeNS(uri, name, value.toString());
      }
    }
    return this;
  }
  defineNamespace(prefix: string, uri: string): DOMArray<T> {
    for (const el of this) {
      if (isEl(el)) {
        const name = `xmlns:${prefix}`;
        el.setAttributeNS(lookupNamespaceURI(name), name, uri);
      }
    }
    return this;
  }
  // jq
  before(content: Nodable): DOMArray<T> {
    return each(this, `before`, content);
  }
  children(selector?: sel): DOMArray<Element> {
    return getSet<Element>(this, (el) => (isEl(el) ? el.children : [])).filter(
      selector
    );
  }
  clone({ deep = true } = {}): DOMArray<T> {
    const list = this.list.map((el) => el.cloneNode(deep) as typeof el);
    return this.newFromList(list);
  }
  // jq
  closest(target: TARGET): DOMArray<Element> {
    if (isSelector(target)) {
      return getSet<Element>(this, (el: Node) => closest(el, target));
    }
    const matcher = (el: Node) => this.newFromList([el]).is(target);
    return getSet<Element>(this, (item: DOMTYPE) => closest(item, matcher));
  }
  // jq
  contents(): DOMArray<Node> {
    return getSet(this, getChildNodes);
  }

  // Get the value of a computed style property for the
  // first element in the set of matched elements or set one
  // or more CSS properties for every matched element.
  css(): CSSStyleDeclaration;
  css(propertyName: string): string;
  css(propertyName: string, value: string): DOMArray;
  css(
    propertyName?: string,
    value?: unknown & { toString(): string }
  ): string | CSSStyleDeclaration | DOMArray {
    const { HTMLElement } = globalThis.window;
    if (value !== undefined) {
      for (const el of this) {
        if (propertyName && el instanceof HTMLElement) {
          el.style.setProperty(propertyName, value.toString());
        }
      }
      return this;
    }
    const [first] = this;
    if (first instanceof HTMLElement) {
      if (!propertyName) {
        return first.style;
      }
      return first.style.getPropertyValue(propertyName);
    }
    return ``;
  }

  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void {
    this.list.forEach(callbackfn);
  }

  each(fn: (i: number, el: T, list: T[]) => void): DOMArray<T> {
    this.list.forEach((el: T, i: number, arr: T[]) => fn.call(el, i, el, arr));
    return this;
  }

  // jq
  empty(): DOMArray<T> {
    for (const el of this) {
      empty(el);
    }
    return this;
  }

  nodeAt(index = 0): Node | null {
    return this.list[index] || null;
  }

  elementAt(index = 0): Element | null {
    let item = this.nodeAt(index);
    return isEl(item) ? item : null;
  }

  eq(index: number): DOMArray<T> {
    if (index < 0) {
      index += this.length;
    }
    if (index >= 0 && index < this.length) {
      return this.newFromList([this.list[index]]);
    }
    return this.newFromList([]);
  }

  filter(target?: sel | FILTER_FN<T>): DOMArray<T> {
    if (!target) {
      return this.slice();
    }
    if (isSelector(target)) {
      return this.arrayFilter((el) => this.config.cssIs(el, target));
    }
    if (typeof target === 'function') {
      return this.arrayFilter((el, i, list) => target.call(el, i, el, list));
    }
    throw new Error('unknown filter target');
  }

  find(target: sel): DOMArray<Element>;
  find(target: FILTER_FN<T>): DOMArray<Node>;
  find(target: sel | FILTER_FN<T>): DOMArray<Element> | DOMArray<Node> {
    if (isSelector(target)) {
      return this.queryAll(target);
    }
    if (typeof target === 'function') {
      return this.newFromList(
        this.list.filter((el, i, list) => target.call(el, i, el, list))
      );
    }
    throw new Error('unknown find target');
  }

  findFirst(target: sel): DOMArray<Element>;
  findFirst(target: FILTER_FN<T>): DOMArray<Node>;
  findFirst(target: string | FILTER_FN<T>): DOMArray<Element> | DOMArray<Node> {
    if (isSelector(target)) {
      return this.query(target);
    }
    if (typeof target === 'function') {
      const found = this.list.find((el, i, list) =>
        target.call(el, i, el, list)
      );
      return this.newFromList(found ? [found] : []);
    }
    throw new Error('unknown findFirst target');
  }

  // jq
  first(): DOMArray<T> {
    return this.slice(0, 1);
  }
  // jq
  last(): DOMArray<T> {
    return this.slice(-1);
  }
  // Filters the list to those with the given dom node as a descendant
  has(thing: string | Node | Node[] | DOMArray): DOMArray<T> {
    if (isSelector(thing)) {
      // Filter the list to those with a descendant that matches the
      // given selector.
      return this.filter(
        (_i, el) => this.config.cssSelectOne([el], thing) !== null
      );
    }
    let nodeThing = thing as Node;
    if (Array.isArray(thing)) {
      [nodeThing] = thing;
    }
    if (DOMArray.isDOMArray(thing)) {
      [nodeThing] = thing.list;
    }
    return this.filter((_i, el) => hasDescendant(el, nodeThing));
  }
  // jq
  html(): string;
  html(str: string): DOMArray;
  html(str?: string): string | DOMArray {
    if (str !== undefined) {
      for (const el of this) {
        if (isEl(el)) {
          el.innerHTML = str;
        }
      }
      return this;
    }
    return this.list
      .filter(Boolean)
      .map((el) => (isEl(el) ? el.innerHTML : el.textContent))
      .join(``);
  }
  xml({ delimiter = '' } = {}): string {
    return this.list
      .map((el) => {
        const s = new globalThis.window.XMLSerializer();
        return s.serializeToString(el);
      })
      .join(delimiter);
  }
  outerHtml(delimiter = ''): string {
    return this.list
      .map((el) => (isEl(el) ? el.outerHTML : el.textContent))
      .join(delimiter);
  }
  // jq
  index(target: ArrayLike<T> | T | DOMArray<T>): number {
    if (Array.isArray(target) || DOMArray.isDOMArray(target)) {
      [target] = target;
    }
    return this.list.findIndex((el) => el === target);
  }
  is(target: TARGET): boolean {
    if (DOMArray.isDOMArray(target)) {
      target = target.list;
    }
    if (Array.isArray(target)) {
      return Boolean(target.find((t) => this.is(t)));
    }
    let finder = target as (value: T) => boolean;
    if (isEl(target) || isTextNode(target)) {
      finder = (el: T) => target === el;
    } else if (isSelector(target)) {
      let selector = target;
      finder = (el) => this.config.cssIs(el, selector);
    } else {
      throw new Error('unknown "is" target');
    }
    return Boolean(this.arrayFind(finder));
  }
  get isTextNode(): boolean {
    return this.length > 0 && isTextNode(this.list[0]);
  }

  map<U extends DOMTYPE>(
    callback: (i: number, el: T, list: DOMArray<T>) => U
  ): DOMArray<U> {
    const list = this.list.map((el, i) => callback.call(el, i, el, this));
    return this.newFromList<U>(list);
  }

  // Filters the list to those whose text matches the given target
  matches(
    target: string | RegExp,
    maybeGetText?: (a: Node, b?: number, c?: DOMArray) => string
  ): DOMArray<T> {
    const getText = maybeGetText
      ? maybeGetText
      : (el: Node) => el.textContent || '';

    return this.arrayFilter(
      (el, i) => getText(el, i, this).match(target) !== null
    );
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
  next(selector?: sel): DOMArray<Node> {
    return getSet(this, (el) =>
      isEl(el) ? el.nextElementSibling : el.nextSibling
    ).filter(selector);
  }
  nextSibling(selector?: sel): DOMArray<Node> {
    return getSet(this, (el) => el.nextSibling).filter(selector);
  }
  nextSiblings(selector?: sel): DOMArray<Node> {
    return getSet(this, nextSiblings).filter(selector);
  }
  // jq: Get all following siblings of each element in the
  // set of matched elements, optionally filtered by a
  // selector.
  nextAll(selector?: sel): DOMArray<Node> {
    const list = this.list
      .map((el) =>
        isEl(el) ? [...nextElementSiblings(el)] : [...nextSiblings(el)]
      )
      .flat()
      .filter(Boolean);
    return this.newFromList(list).filter(selector);
  }

  nextUntil(target: TARGET): DOMArray<Node> {
    return this.nextAll().sliceUntil(target);
  }
  not(
    target: sel | Node | Node[] | DOMArray | ((i: number, el: Node) => boolean)
  ): DOMArray<T> {
    if (isSelector(target)) {
      return this.arrayFilter((el) => !this.config.cssIs(el, target));
    }
    if (isNode(target)) {
      return this.arrayFilter((el) => el !== target);
    }
    if (Array.isArray(target)) {
      return this.arrayFilter((el) => !target.includes(el));
    }
    if (DOMArray.isDOMArray(target)) {
      return this.arrayFilter((el) => !target.list.includes(el));
    }
    if (typeof target === 'function') {
      return this.arrayFilter((el, i) => !target.call(el, i, el));
    }
    throw new Error('unknown "not" target');
  }
  parent(selector?: sel): DOMArray<Element> {
    return getSet<Element>(this, (el) => el.parentElement).filter(selector);
  }
  // jq
  parents(selector?: sel): DOMArray<Element> {
    return getSet<Element>(this, (el) => parentsUntil(el, () => false)).filter(
      selector
    );
  }
  // jq
  parentsUntil(
    input: TARGET<Element>,
    filter?: sel | FILTER_FN<Element>
  ): DOMArray<Element> {
    let target = DOMArray.isDOMArray(input) ? input.toElements() : input;
    let parents = getSet<Element>(this, (el) => parentsUntil(el, target));
    return parents.filter(filter);
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
  prev(selector?: sel): DOMArray<Node> {
    return getSet(this, (el) =>
      isEl(el) ? el.previousElementSibling : el.previousSibling
    ).filter(selector);
  }
  previousSiblings(selector?: sel): DOMArray<Node> {
    return getSet(this, previousSiblings).filter(selector);
  }
  previousSibling(selector?: sel): DOMArray<Node> {
    return getSet(this, (el) => el.previousSibling).filter(selector);
  }

  // Get all preceding siblings of each element in the set
  // of matched elements, optionally filtered by a selector.
  prevAll(selector?: sel): DOMArray<Node> {
    const list = this.list
      .map((el) =>
        isEl(el) ? [...previousElementSiblings(el)] : [...previousSiblings(el)]
      )
      .flat()
      .filter(Boolean);
    return this.newFromList(list).filter(selector);
  }

  prevUntil(target: TARGET): DOMArray<Node> {
    return this.prevAll().sliceUntil(target);
  }

  query(selector: sel): DOMArray<Element> {
    const found = this.config.cssSelectOne(this.toArray(), selector);
    return found ? this.newFromList<Element>([found]) : this.newFromList([]);
  }
  queryAll(selector: sel): DOMArray<Element> {
    return this.newFromList(this.config.cssSelectAll(this.toArray(), selector));
  }

  remove(): DOMArray<T> {
    for (const el of this) {
      if (isEl(el)) {
        el.remove();
      } else {
        el.parentElement?.removeChild(el);
      }
    }
    return this;
  }
  removeAttr(name: string): DOMArray<T> {
    for (const el of this) {
      if (isEl(el)) el.removeAttribute(name);
    }
    return this;
  }
  //jq
  replaceWith(content: Nodable): DOMArray<T> {
    return each(this, `replaceWith`, content);
  }

  // jq
  siblings(selector?: sel): DOMArray<Node> {
    return this.newFromList([
      ...this.prevAll(selector).list.reverse(),
      ...this.nextAll(selector).list,
    ]);
  }

  sliceUntil(target: TARGET): DOMArray<T> {
    if (target) {
      const stop = this.list.findIndex((el) =>
        this.newFromList([el]).is(target)
      );
      if (stop > -1) {
        return this.slice(0, stop);
      }
    }
    return this;
  }

  text(): string;
  text(newText: string): DOMArray<T>;
  text(newText?: string): string | DOMArray<T> {
    if (newText === undefined) {
      return this.list
        .filter(Boolean)
        .map((el) => el.textContent)
        .join(``);
    }
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

  unwrap(): DOMArray<T> {
    for (const el of this) {
      unwrap(el);
    }
    return this;
  }

  without(selector: sel): DOMArray<T> {
    return this.arrayFilter(
      (el) => isEl(el) && !this.config.cssIs(el, selector)
    );
  }

  wrap(target: Nodable): void {
    for (const el of this) {
      const wrapper = thingToNode(target, this);
      if (isEl(wrapper)) {
        el.parentElement?.replaceChild(wrapper, el);
        wrapper.append(el);
      } else {
        throw new Error(`can't wrap target in non-element`);
      }
    }
  }

  toArray(): Array<T> {
    return this.list;
  }

  toElements(): Element[] {
    let elements = (this.list as unknown[]).filter(isEl);
    return elements;
  }

  toSelector(): string {
    return this.toElements().map(nodeToSelector).join(`,`);
  }

  static isDOMArray(thing: unknown): thing is DOMArray {
    return thing instanceof DOMArray;
  }
}

function getChildNodes(el: Node): Node[] {
  const list: Node[] = [];
  for (const child of el.childNodes) {
    if (isEl(child)) {
      list.push(child as Element);
    } else if (isTextNode(child)) {
      list.push(child as Text);
    }
  }
  return list;
}

function getSet<T extends DOMTYPE>(
  domArray: DOMArray,
  getter: (
    el: Node
  ) => T | Iterable<T> | Generator<T> | Array<T> | DOMArray<T> | null
): DOMArray<T> {
  const set = new Set<T>();
  for (const el of domArray) {
    const result = getter(el);
    if (result) {
      let resultArray: Array<T>;
      if (
        typeof (result as { [Symbol.iterator]: unknown })[Symbol.iterator] ===
        `function`
      ) {
        resultArray = Array.from(result as Iterable<T>);
      } else if (isNode(result)) {
        resultArray = [result];
      } else {
        resultArray = result as Array<T>;
      }
      for (const item of resultArray) {
        set.add(item);
      }
    }
  }
  return domArray.newFromList(Array.from(set));
}

function each<T extends DOMTYPE>(
  domArray: DOMArray<T>,
  op: keyof Element | keyof Text,
  val: Nodable
): DOMArray<T> {
  for (const item of domArray) {
    if (typeof (item as never)[op] === `function`) {
      let el = item as never;
      let key = op as keyof typeof el;
      let content = DOMArray.isDOMArray(val) ? [...val] : val;
      if (isHtml(content)) {
        content = [...domArray.newFromHtml(content)];
        if (content.length === 1) {
          [content] = content;
        }
      }
      if (Array.isArray(content)) {
        (el[key] as (...nodes: Array<DOMTYPE>) => unknown)(
          ...Array.from(content)
            .map((item) => thingToNode(item, domArray))
            .filter((x): x is Element | Text => x !== null)
        );
      } else {
        const node = thingToNode(content, domArray);
        if (node) {
          (el[key] as (node: DOMTYPE) => unknown)(node);
        }
      }
    }
  }
  return domArray;
}

type ThingFn = (d?: Document) => Text | Element;
type Nodable = string | Node | Node[] | DOMArray | ThingFn;

function thingToNode(
  thing: Nodable,
  domArray: DOMArray
): Text | Element | null {
  if (Array.isArray(thing) || DOMArray.isDOMArray(thing)) {
    [thing] = thing;
  }
  if (isEl(thing) || isTextNode(thing)) {
    return thing;
  }
  if (isHtml(thing)) {
    let [first] = domArray.newFromHtml(thing).toElements();
    return first || null;
  }
  if (typeof thing === `string` && domArray.document) {
    return createTextNode(thing, domArray.document);
  }
  if (typeof thing === `function`) {
    return (thing as ThingFn)(domArray.document);
  }
  return null;
}
