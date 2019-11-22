
module.exports = {
  isTextNode(thing) {
    return thing && thing.nodeType === 3;
  },
  isEl(thing) {
    return thing && thing.nodeType === 1;
  }
};
