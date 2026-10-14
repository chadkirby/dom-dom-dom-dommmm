/* eslint-disable @typescript-eslint/no-empty-interface */
declare global {
  interface Node {}
  interface Element {}
  interface Document {}
  interface Text {}
  interface DocumentFragment {}
  interface HTMLDivElement {}
  interface CSSStyleDeclaration {}
}

export type DOMParserSupportedType =
  | 'application/xhtml+xml'
  | 'application/xml'
  | 'image/svg+xml'
  | 'text/html'
  | 'text/xml';
