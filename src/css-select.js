const CSSselect = require('css-select');
const { isNode: isTag } = require('./is-node');

const adapter = {
  // is the node a tag?
  isTag,

  // does at least one of passed element nodes pass the test predicate?
  existsOne(test, elems) {
    return elems.find(test);
  },

  // get the attribute value
  getAttributeValue(elem, name) {
    return elem.getAttribute(name);
  },

  // get the node's children
  getChildren({ children }) {
    return [ ...children ];
  },

  // get the name of the tag
  getName(node) {
    let { nodeName } = node;
    return isXml(node) ? nodeName : nodeName.toLowerCase();
  },

  // get the parent of the node
  getParent({ parentElement }) {
    return parentElement;
  },

  /*
    get the siblings of the node. Note that unlike jQuery's `siblings` method,
    this is expected to include the current node as well
  */
  getSiblings({ parentElement }) {
    if (parentElement) {
      return [ ...parentElement.children ];
    }
    return [];
  },

  // get the text content of the node, and its children if it has any
  getText({ textContent }) {
    return textContent;
  },

  // does the element have the named attribute?
  hasAttrib(elem, name) {
    return elem.hasAttribute(name);
  },

  // takes an array of nodes, and removes any duplicates, as well as any nodes
  // whose ancestors are also in the array
  removeSubsets(nodes) {
    return [ ...new Set(nodes) ].filter((node, i, uniques) => {
      while ((node = node.parentElement)) {
        if (uniques.includes(node)) {
          return false;
        }
      }
      return true;
    });
  },

  // finds all of the element nodes in the array that match the test predicate,
  // as well as any of their children that match it
  findAll(test, nodes) {
    let out = [];
    for (const node of nodes) {
      if (test(node)) {
        out.push(node);
      }
      out.push(...adapter.findAll(test, [ ...node.children ]));
    }
    return out;
  },

  // finds the first node in the array that matches the test predicate, or one
  // of its children
  findOne(test, elems) {
    for (const el of elems) {
      if (test(el)) {
        return el;
      }
      let child = adapter.findOne(test, [ ...el.children ]);
      if (child) {
        return child;
      }
    }
  }

};

function isXml(node) {
  return node && /xml/i.test(node.ownerDocument.contentType);
}

module.exports = {
  cssSelectAll(nodes, selector) {
    if (!Array.isArray(nodes)) {
      nodes = [ nodes ];
    }
    return [].concat(...nodes.map(
      (node) => CSSselect(selector, node, {
        adapter,
        xmlMode: isXml(node)
      }))
    );
  },

  cssSelectOne(nodes, selector) {
    if (!Array.isArray(nodes)) {
      nodes = [ nodes ];
    }
    for (const node of nodes) {
      let result = CSSselect.selectOne(selector, node, {
        adapter,
        xmlMode: isXml(node)
      });
      if (result) {
        return result;
      }
    }
  },

  cssIs(node, selector) {
    return CSSselect.is(node, selector, {
      adapter,
      xmlMode: isXml(node)
    });
  }
};
