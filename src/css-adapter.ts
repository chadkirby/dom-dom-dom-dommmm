import { isEl } from './is-node';
export interface ADAPTER {
  cssSelectAll(
    nodes: Node[],
    selector: string,
    fallback?: (nodes: Node[], selector: string) => Element[]
  ): Element[];
  cssSelectOne(
    nodes: Node[],
    selector: string,
    fallback?: (nodes: Element[], selector: string) => Element | null
  ): Element | null;
  cssIs(
    node: Node,
    selector: string,
    fallback?: (node: Element, selector: string) => boolean
  ): boolean;
}

class CSSADAPTER implements ADAPTER {
  cssSelectAll(nodes: Node[], selector: string): Element[] {
    return nodes.reduce(
      (matches: Element[], node: Node) =>
        matches.concat(isEl(node) ? [...node.querySelectorAll(selector)] : []),
      []
    );
  }

  cssSelectOne(nodes: Node[], selector: string): Element | null {
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

  cssIs(node: Node, selector: string): boolean {
    // text nodes can't matches anything
    return isEl(node) && node.matches(selector);
  }
}

export const CssAdapter = new CSSADAPTER();
