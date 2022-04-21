import {assembleJs, comment, docComment, objectKey, propAccess} from '../../main/code';

describe('objectKey', () => {

  test('compiles identifier', () => {
    expect(assembleJs(objectKey('okay'))).toBe('okay');
    expect(assembleJs(objectKey('$okay'))).toBe('$okay');
    expect(assembleJs(objectKey(' _okay'))).toBe('" _okay"');
    expect(assembleJs(objectKey('#$%@'))).toBe('"#$%@"');
    expect(assembleJs(objectKey(''))).toBe('""');
  });

  test('compiles array index', () => {
    expect(assembleJs(objectKey('123'))).toBe('123');
    expect(assembleJs(objectKey('0'))).toBe('0');
    expect(assembleJs(objectKey('0123'))).toBe('"0123"');
    expect(assembleJs(objectKey('0.123'))).toBe('"0.123"');
  });
});

describe('propAccess', () => {

  test('compiles identifier', () => {
    expect(assembleJs(propAccess('a', 'okay'))).toBe('a.okay');
    expect(assembleJs(propAccess('a', '$okay'))).toBe('a.$okay');
    expect(assembleJs(propAccess('a', ' _okay'))).toBe('a[" _okay"]');
    expect(assembleJs(propAccess('a', '#$%@'))).toBe('a["#$%@"]');
    expect(assembleJs(propAccess('a', ''))).toBe('a[""]');
  });

  test('compiles array index', () => {
    expect(assembleJs(propAccess('a', '123'))).toBe('a[123]');
    expect(assembleJs(propAccess('a', '0'))).toBe('a[0]');
    expect(assembleJs(propAccess('a', '0123'))).toBe('a["0123"]');
    expect(assembleJs(propAccess('a', '0.123'))).toBe('a["0.123"]');
  });

  test('compiles optional identifier', () => {
    expect(assembleJs(propAccess('a', 'okay', true))).toBe('a?.okay');
  });

  test('compiles optional array index', () => {
    expect(assembleJs(propAccess('a', '123', true))).toBe('a?.[123]');
  });
});

describe('docComment', () => {

  test('returns an empty string for an empty comment', () => {
    expect(assembleJs(docComment(null))).toBe('');
    expect(assembleJs(docComment(undefined))).toBe('');
    expect(assembleJs(docComment(''))).toBe('');
  });

  test('returns a doc comment', () => {
    expect(assembleJs(docComment('Okay'))).toBe('\n/**\n * Okay\n */\n');
    expect(assembleJs(docComment(0))).toBe('\n/**\n * 0\n */\n');
  });

  test('returns a multiline doc comment', () => {
    expect(assembleJs(docComment('Okay\nYay'))).toBe('\n/**\n * Okay\n * Yay\n */\n');
  });
});

describe('comment', () => {

  test('returns an empty string for an empty comment', () => {
    expect(assembleJs(comment(null))).toBe('');
    expect(assembleJs(comment(undefined))).toBe('');
    expect(assembleJs(comment(''))).toBe('');
  });

  test('returns a comment', () => {
    expect(assembleJs(comment('Okay'))).toBe('// Okay\n');
    expect(assembleJs(comment(0))).toBe('// 0\n');
  });

  test('returns a multiline comment', () => {
    expect(assembleJs(comment('Okay\nYay'))).toBe('// Okay\n// Yay\n');
  });
});
