import { collectTextNodes, createTextNode } from './helpers.js';

/**
 * removes characters from an element, optionally inserting
 * one or more replacements
 */
export function spliceChars(
  $el: Element,
  // character-index at which to start the splice
  startIndex: number,
  // integer counting chars to delete starting at startIndex
  deleteCount: number,
  // elements to insert at startIndex (if any)
  ...insertions: Element[]
): Element {
  const endIndex = startIndex + deleteCount;
  const textNodes = [...collectTextNodes($el)];

  for (
    let nodeIdx = 0, charIdx = 0;
    nodeIdx < textNodes.length && charIdx <= endIndex;
    nodeIdx++
  ) {
    const $node = textNodes[nodeIdx];
    const nodeText = $node.textContent ?? '';
    if (charIdx <= endIndex && startIndex < charIdx + nodeText.length) {
      // copy any text following the end of the deletion range
      const trailingText = nodeText.slice(startIndex - charIdx + deleteCount);
      if (trailingText) {
        // insert the trailing text
        $node.after(createTextNode(trailingText));
      }

      // insert insertions in front of the trailingText
      while (insertions.length) {
        $node.after(insertions.pop()!);
      }

      // copy any text preceding the beginning of the deletion range
      const leadingText = nodeText.slice(0, startIndex - charIdx);
      if (leadingText && startIndex - charIdx > 0) {
        // insert the leading range
        $node.after(createTextNode(leadingText));
      }

      // remove the original text node
      let $parent = $node.parentElement;
      $node.remove();
      // remove empty parent elements (if any)
      while (!$parent?.innerHTML && $parent !== $el) {
        const $grandparent = $parent!.parentElement;
        $parent?.remove();
        $parent = $grandparent;
      }
    }
    charIdx += nodeText.length;
  }
  return $el;
}
