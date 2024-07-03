import * as React from 'react';
import { render } from '@testing-library/react';
import { handleURLs, GROUP_MATCH_REGEXP } from '../render-utils';

describe('handleURLs', () => {
  it('should return the same value if it is not a string', () => {
    // We will only likely get strings, but it shouldn't break/NPE if they are not
    expect(handleURLs(null)).toBe('null');
    expect(handleURLs(undefined)).toBe(undefined);
    expect(handleURLs(true as any)).toBe('true');
    const v = {};
    expect(handleURLs(v as any)).toBe('{}');
  });

  it('should not do anything if there are no URLs in the string', () => {
    const stringsWithoutURLs = [
      'not a URL',
      'redhat.com',
      'http',
      '://something.com',
    ];
    stringsWithoutURLs.forEach((string: string) => {
      expect(handleURLs(string)).toBe(string);
    });
  });

  describe('Test easy URL Examples', () => {
    const validStringsWithURL: { [testName: string]: string } = {
      straightURL: 'https://redhat.com',
      prefixedURL: 'Red Hat website: https://redhat.com',
      suffixedURL: "https://redhat.com is Red Hat's website",
      bothPrefixAndSuffixURL:
        'This is the company website https://redhat.com for Red Hat',
    };

    Object.keys(validStringsWithURL).forEach((testName: string) => {
      const string = validStringsWithURL[testName];
      it(`should create an ExternalLink for the URL, test ${testName}`, () => {
        const reactRendering = handleURLs(string);
        expect(typeof reactRendering).not.toBe('string');
        const comp = render(<div>{reactRendering}</div>);
        expect(comp.findByRole('a')).not.toBeNull();
      });
    });

    describe('verify backing RegExp finds the urls', () => {
      Object.keys(validStringsWithURL).forEach((testName: string) => {
        const string = validStringsWithURL[testName];
        it(`should find the URL, test ${testName}`, () => {
          const [, , url] = string.match(GROUP_MATCH_REGEXP);
          expect(url).toBe('https://redhat.com');
        });
      });
    });
  });
});
