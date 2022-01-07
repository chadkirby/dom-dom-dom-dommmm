import { isEl } from './is-node.js';

// takes an array of nodes, and removes any duplicates, as
// well as any nodes whose ancestors are also in the array
export function removeSubsets(nodes: Node[]): Element[] {
  const elements = [...new Set(nodes)].filter(isEl);
  return elements.filter((node, _i, uniques) => {
    while (node.parentElement) {
      node = node.parentElement;
      if (uniques.includes(node)) {
        return false;
      }
    }
    return true;
  });
}
