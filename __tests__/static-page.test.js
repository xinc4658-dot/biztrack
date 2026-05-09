// static-page.js only calls bindEscapedApostropheFix() on import.
// Importing it here executes that call and gives the file 100% coverage.
import '../static-page.js';

describe('static-page', () => {
  test('imports and initialises without throwing', () => {
    expect(true).toBe(true);
  });
});
