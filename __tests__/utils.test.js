import { escapeHTML, replaceParams } from '../i18n/utils.js';

describe('escapeHTML', () => {
  test('escapes & character', () => {
    expect(escapeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  test('escapes < and > characters', () => {
    expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
  });

  test('escapes single quote', () => {
    expect(escapeHTML("it's")).toBe('it&#39;s');
  });

  test('escapes double quote', () => {
    expect(escapeHTML('"hello"')).toBe('&quot;hello&quot;');
  });

  test('escapes all special characters together', () => {
    expect(escapeHTML('<a href="test" & \'x\'>')).toBe(
      '&lt;a href=&quot;test&quot; &amp; &#39;x&#39;&gt;'
    );
  });

  test('returns plain text unchanged', () => {
    expect(escapeHTML('hello world')).toBe('hello world');
  });

  test('returns empty string unchanged', () => {
    expect(escapeHTML('')).toBe('');
  });

  test('returns non-string values as-is', () => {
    expect(escapeHTML(123)).toBe(123);
    expect(escapeHTML(null)).toBe(null);
    expect(escapeHTML(undefined)).toBe(undefined);
  });
});

describe('replaceParams', () => {
  test('replaces a single placeholder', () => {
    expect(replaceParams('Hello, {name}!', { name: 'Alice' })).toBe('Hello, Alice!');
  });

  test('replaces multiple placeholders', () => {
    expect(replaceParams('{a} and {b}', { a: 'foo', b: 'bar' })).toBe('foo and bar');
  });

  test('replaces repeated placeholders', () => {
    expect(replaceParams('{x} + {x} = 2{x}', { x: '1' })).toBe('1 + 1 = 21');
  });

  test('returns text unchanged when no params', () => {
    expect(replaceParams('No placeholders', null)).toBe('No placeholders');
  });

  test('returns non-string text as-is', () => {
    expect(replaceParams(42, { a: 'b' })).toBe(42);
  });

  test('returns text unchanged when params is empty object', () => {
    expect(replaceParams('Hello {name}', {})).toBe('Hello {name}');
  });
});
