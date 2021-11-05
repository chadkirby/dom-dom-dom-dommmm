const { parse, lookupNamespaceURI } = require('./helpers');
const { DOMArray, contentTypes } = require('./dom-array');
const { fragmentToText, fragmentToHtml, isHtml } = require('./helpers');
const { isTextNode, isEl } = require('./is-node');
const { removeSubsets } = require('./remove-subsets');

function wrapper({ document: baseDocument }, { toHtml, cssAdapter } = {}) {
  class DOMList extends DOMArray {
    static get document() {
      return baseDocument || globalThis.document;
    }
    static cssSelectAll(nodes, selector) {
      let contentType = this.document.contentType.toLowerCase();
      try {
        return cssAdapter[contentType].cssSelectAll(
          removeSubsets(nodes),
          selector,
          super.cssSelectAll
        );
      } catch (e) {
        return super.cssSelectAll(nodes, selector);
      }
    }
    static cssSelectOne(nodes, selector) {
      let contentType = this.document.contentType.toLowerCase();
      try {
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
      let contentType = this.document.contentType.toLowerCase();
      try {
        return cssAdapter[contentType].cssIs(node, selector, super.cssIs);
      } catch (e) {
        return super.cssIs(node, selector);
      }
    }
  }

  function $(arg) {
    if (!arg) {
      return DOMList.of();
    }
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
    let html = toHtml && toHtml(arg);
    if (html) {
      return DOMList.fromHtml(html);
    }
  }

  Object.assign($, {
    get document() {
      return DOMList.document;
    },
    createElementNS(tagName) {
      let [ prefix ] = tagName.split(':');
      let uri = lookupNamespaceURI(prefix, DOMList.document);
      if (!uri) {
        throw new Error(`unknown namespace for ${prefix}`);
      }
      return DOMList.of(DOMList.document.createElementNS(uri, tagName));
    },
    query(selector) {
      let found = DOMList.document.querySelector(selector);
      return found ? DOMList.of(found) : DOMList.of();
    },
    queryAll(selector) {
      return DOMList.from(DOMList.document.querySelectorAll(selector));
    },
    html(thing) {
      if (typeof thing === 'string') {
        return DOMList.from(DOMList.document.querySelectorAll(thing)).outerHtml();
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
    xml(doc = DOMList.document) {
      if (DOMList.isDOMArray(doc)) {
        [ doc ] = doc;
      }
      let s = new globalThis.window.XMLSerializer();
      return s.serializeToString(doc);
    },
    text(selector) {
      if (selector) {
        return DOMList.from(DOMList.document.querySelectorAll(selector)).text();
      }
      return fragmentToText(DOMList.document);
    },
    setHtmlAdapter(adapter) {
      toHtml = adapter;
    },
    setCssAdapter(adapter) {
      cssAdapter = adapter;
    }
  });

  return $;
}


module.exports = {
  $: wrapper({ document: globalThis.document }),
  loadHtml(
    html = `<!DOCTYPE html><body></body></html>`,
    { toHtml, cssAdapter } = {}
  ) {
    let document = parse(html, contentTypes.html);
    return wrapper({ document }, { toHtml, cssAdapter });
  },
  loadXml(
    xml = `<?xml version="1.0" ?><root />`,
    { toHtml, cssAdapter } = {}
  ) {
    let document = parse(xml, contentTypes.xml);
    return wrapper({ document }, { toHtml, cssAdapter });
  },
  new(document, { toHtml, cssAdapter } = {}) {
    return wrapper({ document }, { toHtml, cssAdapter });
  },
  ...require('./helpers'),
  ...require('./splice-chars'),
  ...require('./tag-functions')
};
