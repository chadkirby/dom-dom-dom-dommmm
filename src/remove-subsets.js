// takes an array of nodes, and removes any duplicates, as
// well as any nodes whose ancestors are also in the array
function removeSubsets(nodes) {
  return [...new Set(nodes)].filter((node, i, uniques) => {
    if (node.nodeType !== 1) {
      return false;
    }
    while ((node = node.parentElement)) {
      if (uniques.includes(node)) {
        return false;
      }
    }
    return true;
  });
}

module.exports = {
  removeSubsets,
};
