import type { JSDOM as JSDOMT } from 'jsdom';

// Augment the global `Window` interface to include the `jsdom`
// property. This will allow TypeScript to recognize the `jsdom`
// property on the global object.
declare global {
  interface Window {
    jsdom: JSDOMT;
  }
}

export const setup = (JSDOM: new (html?: string) => JSDOMT): void => {
  const jsdom = new JSDOM('');

  // Assign the created jsdom instance and DOM globals to globalThis
  // using Object.assign to avoid strict Window & typeof globalThis
  // type mismatches with JSDOM's DOMWindow.
  Object.assign(globalThis, {
    jsdom,
    window: jsdom.window,
    document: jsdom.window.document,
  });
};

export default setup;
