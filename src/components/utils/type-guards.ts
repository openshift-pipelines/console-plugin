/** Type guards for JSON-compatible Kubernetes resource values. */
export const typeChecks = {
  isString(value: unknown): value is string {
    return typeof value === 'string';
  },

  isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  },

  isRecord(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  },
};
