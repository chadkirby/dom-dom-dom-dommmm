import { test as vTest, assert as vAssert } from 'vitest';
import { JSDOM } from 'jsdom';
import { setup } from '../src/setup.js';

// Initialize JSDOM globals
setup(JSDOM);

function normalizeForLoose(val: unknown): unknown {
  if (val && typeof val === 'object' && 'DOMArray' in val) {
    return Array.from(val as unknown as Iterable<unknown>);
  }
  return val;
}

function isElementOrNode(val: unknown): val is Node {
  return (
    val != null &&
    typeof val === 'object' &&
    typeof (val as { nodeType?: unknown }).nodeType === 'number'
  );
}

function compareLoose(actual: unknown, expected: unknown): boolean {
  if (isElementOrNode(actual) && isElementOrNode(expected)) {
    return actual === expected;
  }
  if (actual == null || expected == null) {
    // eslint-disable-next-line eqeqeq
    return actual == expected;
  }
  if (typeof actual !== 'object' || typeof expected !== 'object') {
    // eslint-disable-next-line eqeqeq
    return actual == expected;
  }
  const normActual = normalizeForLoose(actual);
  const normExpected = normalizeForLoose(expected);
  if (Array.isArray(normActual) && Array.isArray(normExpected)) {
    if (normActual.length !== normExpected.length) return false;
    for (let i = 0; i < normActual.length; i++) {
      if (!compareLoose(normActual[i], normExpected[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(normActual as Record<string, unknown>);
  const keysB = Object.keys(normExpected as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (
      !compareLoose(
        (normActual as Record<string, unknown>)[key],
        (normExpected as Record<string, unknown>)[key],
      )
    )
      return false;
  }
  return true;
}

// Extend Vitest's native assert with the single non-standard helper used by DOMArray tests
export const assert = Object.assign(vAssert, {
  deepLooseEqual(actual: unknown, expected: unknown, msg?: string): void {
    if (!compareLoose(actual, expected)) {
      vAssert.fail(
        `${msg ? msg + ': ' : ''}deepLooseEqual failed.\nActual: ${String(actual)}\nExpected: ${String(expected)}`,
      );
    }
  },
});

export type CustomAssert = Omit<typeof assert, 'ok'> & {
  ok(val: unknown, msg?: string): void;
};
export type TestFn = (a: CustomAssert) => void | Promise<void>;

export function test(desc: string, testFn: TestFn): void {
  vTest(desc, () => testFn(assert));
}
