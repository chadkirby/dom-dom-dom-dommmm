const NODE_TYPES = new Set([ 1, 3 ]);
function isNode(thing) {
  return thing && NODE_TYPES.has(thing.nodeType);
}

module.exports = {
  isNode
};
