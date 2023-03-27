/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // Assign the created `jsdom` instance to the global object. We need
  // to use `any` type when assigning to globalThis properties, because
  // TypeScript doesn't allow assigning to read-only properties. This
  // approach, however, keeps the typings for the rest of your code
  // intact.
  (globalThis as any).jsdom = jsdom;

  // Assign the `window` property of the `jsdom` instance to the global
  // object. Using `any` type for the same reason as explained above.
  (globalThis as any).window = jsdom.window;

  // Assign the `document` property of the `jsdom.window` instance to
  // the global object. Using `any` type for the same reason as
  // explained above.
  (globalThis as any).document = jsdom.window.document;
};
