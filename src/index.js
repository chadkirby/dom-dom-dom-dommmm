const globalThis = require('globalthis')();
const globalDocument = globalThis.document || globalThis.DOM_DOM_DOCUMENT;
const wrapper = require('./wrapper');
module.exports = {
  ...require('./helpers'),
  ...require('./splice-chars'),
  ...require('./tag-functions'),
  $: wrapper(globalDocument)
};
