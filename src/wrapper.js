const { DOMArray } = require('./dom-array');
const { createElement } = require('./helpers');
const { isNode } = require('./is-node');

module.exports = function(document) {
  function $(arg) {
    if (!arg) {
      return DOMArray.of();
    }
    if (Array.isArray(arg)) {
      return DOMArray.from(arg);
    }
    if (isNode(arg)) {
      return DOMArray.of(arg);
    }
    if (typeof arg === `string`) {
      if (/</.test(arg)) {
        return DOMArray.of(createElement(arg, document));
      }
      return DOMArray.from(document.querySelectorAll(arg));
    }
  }

  Object.assign($, {
    html(thing) {
      if (Array.isArray(thing)) {
        return thing.map((el) => el.outerHTML).join(``);
      }
      return thing.outerHTML;
    }
  });

  return $;
};
