module.exports = {
  cssSelectAll(nodes, selector) {
    return nodes.reduce(
      (matches, node) => matches.concat([...node.querySelectorAll(selector)]),
      []
    );
  },

  cssSelectOne(nodes, selector) {
    for (const node of nodes) {
      let result = node.querySelector(selector);
      if (result) {
        return result;
      }
    }
  },

  cssIs(node, selector) {
    // text nodes can't matches anything
    return node.matches && node.matches(selector);
  },
};
