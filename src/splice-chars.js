const { collectTextNodes, createTextNode } = require('./helpers');

/**
 * removes characters from an element, optionally inserting
 * one or more replacements
 *
 * @param   {HTMLElement}  $el
 * @param   {number}  startIndex  character-index at which to start the splice
 * @param   {number}  deleteCount  integer counting chars to delete starting at startIndex
 * @param   {HTMLElement}  ...insertions  elements to insert at startIndex (if any)
 *
 * @return  {HTMLElement}  returns the input element
 */
function spliceChars($el, startIndex, deleteCount, ...insertions) {
  let endIndex = startIndex + deleteCount;
  let textNodes = [ ...collectTextNodes($el) ];

  for (let nodeIdx = 0, charIdx = 0; nodeIdx < textNodes.length && charIdx <= endIndex; nodeIdx++) {
    let $node = textNodes[nodeIdx];
    let nodeText = $node.textContent;
    if (charIdx <= endIndex && startIndex < charIdx + nodeText.length) {
      // copy any text following the end of the deletion range
      let trailingText = nodeText.slice(startIndex - charIdx + deleteCount);
      if (trailingText) {
        // insert the trailing text
        $node.after(createTextNode(trailingText));
      }

      // insert insertions in front of the trailingText
      while (insertions.length) {
        $node.after(insertions.pop());
      }

      // copy any text preceding the beginning of the deletion range
      let leadingText = nodeText.slice(0, startIndex - charIdx);
      if (leadingText && startIndex - charIdx > 0) {
        // insert the leading range
        $node.after(createTextNode(leadingText));
      }

      // remove the original text node
      let $parent = $node.parentNode;
      $node.remove();
      // remove empty parent elements (if any)
      while (!$parent.innerHTML && $parent !== $el) {
        let $grandparent = $parent.parentNode;
        $parent.remove();
        $parent = $grandparent;
      }
    }
    charIdx += nodeText.length;
  }
  return $el;
}

module.exports = { spliceChars };
