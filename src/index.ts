import {
  parse,
  lookupNamespaceURI,
  fragmentToText,
  fragmentToHtml,
  isHtml,
} from './helpers.js';
import { DOMArray, contentTypes, defaultConfig } from './dom-array.js';
import type { CONFIG as DOMARRAY_CONFIG } from './dom-array.js';
import { isTextNode, isEl, isNode } from './is-node.js';
import { removeSubsets } from './remove-subsets.js';
import { ADAPTER } from './css-adapter.js';

type TOHTML = (node: unknown) => string;
type Config = {
  toHtml?: TOHTML;
  cssAdapter?: Record<string, ADAPTER>;
};

export type TDOMArray = DOMArray;

export function isDomDom(obj: unknown): obj is TDOMArray {
  return DOMArray.isDOMArray(obj);
}

export function wrapper(
  baseDocument?: Document,
  { toHtml, cssAdapter }: Config = {}
) {
  const config: DOMARRAY_CONFIG = {
    get document() {
      return baseDocument || globalThis.document;
    },

    cssSelectAll(nodes: Node[], selector: string) {
      const contentType = this.document.contentType.toLowerCase();
      try {
        if (cssAdapter === undefined) {
          throw new Error('no css adapter');
        }
        return cssAdapter[contentType].cssSelectAll(
          removeSubsets(nodes),
          selector,
          defaultConfig.cssSelectAll
        );
      } catch (e) {
        return defaultConfig.cssSelectAll(nodes, selector);
      }
    },
    cssSelectOne(nodes: Node[], selector: string) {
      const contentType = this.document.contentType.toLowerCase();
      try {
        if (cssAdapter === undefined) {
          throw new Error('no css adapter');
        }
        return cssAdapter[contentType].cssSelectOne(
          removeSubsets(nodes),
          selector,
          defaultConfig.cssSelectOne
        );
      } catch (e) {
        return defaultConfig.cssSelectOne(nodes, selector);
      }
    },
    cssIs(node: Node, selector: string) {
      const contentType = this.document.contentType.toLowerCase();
      try {
        if (cssAdapter === undefined) {
          throw new Error('no css adapter');
        }
        return cssAdapter[contentType].cssIs(
          node,
          selector,
          defaultConfig.cssIs
        );
      } catch (e) {
        return defaultConfig.cssIs(node, selector);
      }
    },
  };

  function wrapIt(
    el: Element | Element[] | Iterable<Element>
  ): DOMArray<Element>;
  function wrapIt(textNode: Text | Text[] | Iterable<Text>): DOMArray<Text>;
  function wrapIt(arg: null | undefined): DOMArray;
  function wrapIt(htmlOrSelector: string): DOMArray<Element>;
  function wrapIt(
    arg?: DOMArray<Node> | Node | Node[] | Iterable<Node> | string | null
  ): DOMArray<Element> | DOMArray<Text> | DOMArray {
    if (DOMArray.isDOMArray(arg)) {
      return arg;
    }
    if (arg === null || arg === undefined || arg === '') {
      return DOMArray.from([], config);
    }
    if (Array.isArray(arg)) {
      return DOMArray.from(arg, config);
    }
    if (typeof arg === `string`) {
      if (isHtml(arg)) {
        return DOMArray.fromHtml(arg, config);
      }
      return DOMArray.from([...config.document.querySelectorAll(arg)], config);
    }
    if (isIterable<Node>(arg)) {
      return DOMArray.from([...arg], config);
    }
    if (isNode(arg)) {
      return DOMArray.from([arg], config);
    }
    if (arg && toHtml) {
      const html = toHtml(arg);
      if (html) {
        return DOMArray.fromHtml(html, config);
      }
    }
    return DOMArray.from([], config);
  }

  const $ = Object.assign(wrapIt, {
    document: globalThis.document, // assign here so that typescript understands that it's a property
    createElementNS(tagName: string): DOMArray<Element> {
      const [prefix] = tagName.split(':');
      const uri = lookupNamespaceURI(prefix, config.document);
      if (!uri) {
        throw new Error(`unknown namespace for ${prefix}`);
      }
      return DOMArray.from<Element>(
        [config.document.createElementNS(uri, tagName)],
        config
      );
    },
    query(selector: string): DOMArray<Element> {
      const found = config.document.querySelector(selector);
      return found
        ? DOMArray.from<Element>([found], config)
        : DOMArray.from([], config);
    },
    queryAll(selector: string): DOMArray<Element> {
      return DOMArray.from<Element>(
        [...config.document.querySelectorAll(selector)],
        config
      );
    },
    html(thing?: string | DOMArray | Node): string {
      if (thing === undefined) {
        return fragmentToHtml(config.document);
      }
      if (typeof thing === 'string') {
        return DOMArray.from(
          [...config.document.querySelectorAll(thing)],
          config
        ).outerHtml();
      }
      if (DOMArray.isDOMArray(thing)) {
        return thing.outerHtml();
      }
      if (isEl(thing)) {
        return thing.outerHTML;
      }
      if (isTextNode(thing)) {
        return thing.textContent!;
      }
      return '';
    },
    xml(doc: Document | DOMArray | Node = config.document): string {
      if (DOMArray.isDOMArray(doc)) {
        [doc] = doc;
      }
      const s = new globalThis.window.XMLSerializer();
      return s.serializeToString(doc);
    },
    text(selector: string): string {
      if (selector) {
        const results = config.document.querySelectorAll(selector);
        const $r = DOMArray.from([...results], config);
        return $r.text();
      }
      return fragmentToText(config.document);
    },
    setHtmlAdapter(adapter: TOHTML) {
      toHtml = adapter;
    },
    setCssAdapter(adapter: Config['cssAdapter']) {
      cssAdapter = adapter;
    },
  });

  // redefine document as a getter so that if we're in Node, the caller
  // can configure/reconfigure JSDOM after dom-dom is initialized
  Object.defineProperties($, {
    document: {
      get(): Document {
        return config.document;
      },
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

export * from './helpers.js';
export * from './splice-chars.js';
export * from './tag-functions.js';
export * from './is-node.js';

function isIterable<T>(item: unknown): item is Iterable<T> {
  return (
    Boolean(item) && typeof (item as never)[Symbol.iterator] === 'function'
  );
}
