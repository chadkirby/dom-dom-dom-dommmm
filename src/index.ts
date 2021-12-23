import { parse, lookupNamespaceURI } from './helpers';
import { DOMArray, contentTypes } from './dom-array';
import { fragmentToText, fragmentToHtml, isHtml } from './helpers';
import { isTextNode, isEl, isNode } from './is-node';
import { removeSubsets } from './remove-subsets';
import { ADAPTER } from './css-adapter';

type TOHTML = (node: unknown) => string;
type Config = {
  toHtml?: TOHTML;
  cssAdapter?: Record<string, ADAPTER>;
};

export function wrapper(
  baseDocument?: Document,
  { toHtml, cssAdapter }: Config = {}
) {
  class DOMList extends DOMArray {
    static get document() {
      return baseDocument || globalThis.document;
    }
    static cssSelectAll(nodes, selector) {
      const contentType = this.document.contentType.toLowerCase();
      try {
        if (cssAdapter === undefined) {
          throw new Error('no css adapter');
        }
        return (cssAdapter[contentType] as ADAPTER).cssSelectAll(
          removeSubsets(nodes),
          selector,
          super.cssSelectAll
        );
      } catch (e) {
        return super.cssSelectAll(nodes, selector);
      }
    }
    static cssSelectOne(nodes, selector) {
      const contentType = this.document.contentType.toLowerCase();
      try {
        if (cssAdapter === undefined) {
          throw new Error('no css adapter');
        }
        return cssAdapter[contentType].cssSelectOne(
          removeSubsets(nodes),
          selector,
          super.cssSelectOne
        );
      } catch (e) {
        return super.cssSelectOne(nodes, selector);
      }
    }
    static cssIs(node, selector) {
      const contentType = this.document.contentType.toLowerCase();
      try {
        if (cssAdapter === undefined) {
          throw new Error('no css adapter');
        }
        return cssAdapter[contentType].cssIs(node, selector, super.cssIs);
      } catch (e) {
        return super.cssIs(node, selector);
      }
    }
  }

  function $(
    arg?: Text | Element | (Text | Element)[] | string | unknown
  ): DOMList {
    if (Array.isArray(arg)) {
      return DOMList.from(arg);
    }
    if (isEl(arg) || isTextNode(arg)) {
      return DOMList.of(arg);
    }
    if (typeof arg === `string`) {
      if (isHtml(arg)) {
        return DOMList.fromHtml(arg);
      }
      return DOMList.from(DOMList.document.querySelectorAll(arg));
    }
    if (isNode(arg)) {
      return DOMList.of(arg);
    }
    if (arg && toHtml) {
      const html = toHtml(arg);
      if (html) {
        return DOMList.fromHtml(html);
      }
    }
    return DOMList.of();
  }

  Object.assign($, {
    get document(): Document {
      return DOMList.document;
    },
    createElementNS(tagName): DOMList {
      const [prefix] = tagName.split(':');
      const uri = lookupNamespaceURI(prefix, DOMList.document);
      if (!uri) {
        throw new Error(`unknown namespace for ${prefix}`);
      }
      return DOMList.of(DOMList.document.createElementNS(uri, tagName));
    },
    query(selector): DOMList {
      const found = DOMList.document.querySelector(selector);
      return found ? DOMList.of(found) : DOMList.of();
    },
    queryAll(selector): DOMList {
      return DOMList.from(DOMList.document.querySelectorAll(selector));
    },
    html(thing): string {
      if (typeof thing === 'string') {
        return DOMList.from(
          DOMList.document.querySelectorAll(thing)
        ).outerHtml();
      }
      if (DOMList.isDOMArray(thing)) {
        return thing.outerHtml();
      }
      if (isEl(thing)) {
        return thing.outerHTML;
      }
      if (!arguments.length) {
        return fragmentToHtml(DOMList.document);
      }
      return '';
    },
    xml(doc: Document | DOMArray | Node = DOMList.document): string {
      if (DOMList.isDOMArray(doc)) {
        [doc] = doc;
      }
      const s = new globalThis.window.XMLSerializer();
      return s.serializeToString(doc);
    },
    text(selector): string {
      if (selector) {
        const results = DOMList.document.querySelectorAll(selector);
        const $r = DOMList.from(results);
        return $r.text() as string;
      }
      return fragmentToText(DOMList.document);
    },
    setHtmlAdapter(adapter: TOHTML) {
      toHtml = adapter;
    },
    setCssAdapter(adapter) {
      cssAdapter = adapter;
    },
  });

  return $;
}

export const $ = wrapper();
export function loadHtml(
  html = `<!DOCTYPE html><body></body></html>`,
  { toHtml, cssAdapter }: Config = {}
) {
  const document = parse(html, contentTypes.html);
  return wrapper(document, { toHtml, cssAdapter });
}
export function loadXml(
  xml = `<?xml version="1.0" ?><root />`,
  { toHtml, cssAdapter }: Config = {}
) {
  const document = parse(xml, contentTypes.xml);
  return wrapper(document, { toHtml, cssAdapter });
}

export * from './helpers';
export * from './splice-chars';
export * from './tag-functions';
