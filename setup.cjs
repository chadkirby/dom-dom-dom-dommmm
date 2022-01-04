module.exports = ({ JSDOM }) => {
  const jsdom = (globalThis.jsdom = new JSDOM(''));
  globalThis.window = jsdom.window;
  globalThis.document = jsdom.window.document;
};
