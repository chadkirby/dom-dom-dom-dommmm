import { collectTextNodes, createTextNode } from './helpers.js';

export function makeDom(baseDocument?: Document) {
  return function (
    x: TemplateStringsArray,
    ...placeholders: unknown[]
  ): HTMLDivElement {
    const document = baseDocument ?? globalThis.document;
    const div = document.createElement('div');
    try {
      if (document.contentType.toLowerCase().endsWith('xml')) {
        // add the div to the DOM so it will inherit the
        // document's namespaces
        document.firstElementChild?.append(div);
      }
      div.innerHTML = assemble(x, ...placeholders);
    } finally {
      div.remove();
    }

    for (const node of collectTextNodes(div)) {
      const trimmed = (node.textContent || '').replace(
        /^\s*\n\s*|\s*\n\s*$/g,
        ''
      );
      if (node.textContent && !trimmed) {
        // remove the node if we just emptied it out
        node.remove();
      } else {
        node.textContent = trimmed;
      }
    }
    return div;
  };
}

/**
 * Tagged template function to convert possibly pretty html to an unpretty
 * document fragment. E.g.
 *
 * dom`&lt;p>foo&lt;\p>`
 *
 *  @param   {TemplateStringsArray}  ...  template literal
 *
 * @return  {HTMLElement}  document fragment
 */
export const dom = makeDom();

/**
 * Tagged template function to convert html to an element. E.g.
 *
 * el`<p>foo</p>`
 *
 * @param   {TemplateStringsArray}  ...  template literal
 *
 * @return  {HTMLElement}  element
 */
export function el(
  x: TemplateStringsArray,
  ...placeholders: unknown[]
): Element | null {
  return dom(x, ...placeholders).firstElementChild;
}

/**
 * Tagged template function to create a text node. E.g.
 *
 * text`foo`
 *
 * @param   {TemplateStringsArray}  ...  template literal
 *
 * @return  {HTMLElement}  element
 */
export function text(x: TemplateStringsArray, ...args: unknown[]): Text {
  return createTextNode(assemble(x, ...args));
}

/**
 * Tagged template function to de-format an html string. E.g.
 *
 *  unpretty`&lt;p>
 *   &lt;foo />
 * &lt;/p>` === '&lt;p>&lt;foo>&lt;/foo>&lt;/p>'
 *
 * @param   {TemplateStringsArray}  ...  template literal
 *
 * @return  {string}  de-formatted html
 */
export function unpretty(x: TemplateStringsArray, ...args: unknown[]): string {
  return dom(x, ...args).innerHTML;
}

export function unprettyns(
  namespaces = {}
): (x: TemplateStringsArray, ...args: unknown[]) => string {
  let xml = `<?xml version="1.0" encoding="utf-8" ?><root`;
  for (const [prefix, ns] of Object.entries(namespaces)) {
    xml += ` xmlns:${prefix}="${ns}"`;
  }
  xml += ' />';
  const document = new globalThis.window.DOMParser().parseFromString(
    xml,
    'text/xml'
  );
  if (document.firstElementChild?.matches('parsererror')) {
    const msg = document.firstElementChild.textContent || '';
    throw new Error(msg);
  }
  function unprettyx(x: TemplateStringsArray, ...args: unknown[]): string {
    return makeDom(document)(x, ...args).innerHTML;
  }

  return unprettyx;
}

/**
 * assemble a template literal into a string
 */
function assemble(strings: TemplateStringsArray, ...placeholders: unknown[]) {
  return [...strings.entries()]
    .map(([i, str]) => `${str}${placeholders[i] || ``}`)
    .join(``);
}
