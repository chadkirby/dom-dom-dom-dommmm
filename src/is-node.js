
module.exports = {
  isTextNode(thing) {
    return thing && thing.ownerDocument && thing.nodeType === 3;
  },
  isEl(thing) {
    return thing && thing.ownerDocument && thing.nodeType === 1;
  }
};
