import { isEl } from './is-node';

type TextEl = Text | Element;
export interface ADAPTER {
  cssSelectAll(
    nodes: TextEl[],
    selector: string,
    fallback?: (nodes: TextEl[], selector: string) => Element[]
  ): Element[];
  cssSelectOne(
    nodes: TextEl[],
    selector: string,
    fallback?: (nodes: Element[], selector: string) => Element | null
  ): Element | null;
  cssIs(
    node: TextEl,
    selector: string,
    fallback?: (node: Element, selector: string) => boolean
  ): boolean;
}

class CSSADAPTER implements ADAPTER {
  cssSelectAll(nodes: TextEl[], selector: string): Element[] {
    return nodes.reduce(
      (matches: Element[], node: TextEl) =>
        matches.concat(isEl(node) ? [...node.querySelectorAll(selector)] : []),
      []
    );
  }

  cssSelectOne(nodes: TextEl[], selector: string): Element | null {
    for (const node of nodes) {
      if (isEl(node)) {
        const result = node.querySelector(selector);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  cssIs(node: TextEl, selector: string): boolean {
    // text nodes can't matches anything
    return isEl(node) && node.matches(selector);
  }
}

export const CssAdapter = new CSSADAPTER();
