import { sanitizeHref } from '../utils';

describe('sanitizeHref — safe inputs', () => {
  it('allows https', () =>
    expect(sanitizeHref('https://example.com')).toBe('https://example.com/'));
  it('allows http', () =>
    expect(sanitizeHref('http://example.com')).toBe('http://example.com/'));
  it('allows /relative', () =>
    expect(sanitizeHref('/foo/bar')).toBe('/foo/bar'));
  it('allows ./relative', () => expect(sanitizeHref('./foo')).toBe('./foo'));
  it('handles undefined', () => expect(sanitizeHref(undefined)).toBe(''));
  it('handles empty string', () => expect(sanitizeHref('')).toBe(''));
});

describe('sanitizeHref — scheme attacks', () => {
  it('blocks javascript:', () =>
    expect(sanitizeHref('javascript:alert(1)')).toBe(''));
  it('blocks Javascript: (case)', () =>
    expect(sanitizeHref('Javascript:alert(1)')).toBe(''));
  it('blocks data:', () =>
    expect(sanitizeHref('data:text/html,<h1>x</h1>')).toBe(''));
  it('blocks vbscript:', () =>
    expect(sanitizeHref('vbscript:MsgBox(1)')).toBe(''));
  it('blocks bare string', () => expect(sanitizeHref('alert(1)')).toBe(''));
});

describe('sanitizeHref — backslash / protocol-relative bypass', () => {
  // Core regression: browser normalises /\ into // (protocol-relative)
  it('blocks /\\example.com', () =>
    expect(sanitizeHref('/\\example.com')).toBe(''));
  it('blocks //example.com', () =>
    expect(sanitizeHref('//example.com')).toBe(''));
  it('blocks \\\\example.com', () =>
    expect(sanitizeHref('\\\\example.com')).toBe(''));
  it('blocks mixed slashes /\\/path', () =>
    expect(sanitizeHref('/\\/path')).toBe(''));

  // Backslash within a safe absolute URL is normalized and allowed
  it('normalizes backslash in https URL path', () =>
    expect(sanitizeHref('https://example.com/foo\\bar')).toBe(
      'https://example.com/foo/bar',
    ));

  // Safe relative paths that happen to contain no backslash are unchanged
  it('leaves clean relative path alone', () =>
    expect(sanitizeHref('/foo/bar')).toBe('/foo/bar'));
});
