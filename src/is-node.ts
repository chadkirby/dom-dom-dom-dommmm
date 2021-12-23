export function isTextNode(thing: unknown | undefined): thing is Text {
  return isNode(thing, 3);
}

export function isEl(thing: unknown | undefined): thing is Element {
  return isNode(thing, 1);
}

export function isNode(
  thing: unknown | undefined,
  targetType = -1
): thing is Node {
  if (thing === undefined) {
    return false;
  }
  const node = thing as Node;
  if (!node.ownerDocument) {
    return false;
  }
  if (targetType > 0) {
    return node.nodeType === targetType;
  }
  return node.nodeType > 0;
}
