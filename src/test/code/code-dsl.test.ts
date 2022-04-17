import {assembleJs, createVarRenamer} from '../../main/code';
import {comment, docComment, prop, propAccess} from '../../main/code/code-dsl';

describe('prop', () => {

  test('compiles identifier', () => {
    expect(assembleJs(prop('okay'), createVarRenamer())).toBe('okay');
    expect(assembleJs(prop('$okay'), createVarRenamer())).toBe('$okay');
    expect(assembleJs(prop(' _okay'), createVarRenamer())).toBe('" _okay"');
    expect(assembleJs(prop('#$%@'), createVarRenamer())).toBe('"#$%@"');
    expect(assembleJs(prop(''), createVarRenamer())).toBe('""');
  });

  test('compiles array index', () => {
    expect(assembleJs(prop('123'), createVarRenamer())).toBe('123');
    expect(assembleJs(prop('0'), createVarRenamer())).toBe('0');
    expect(assembleJs(prop('0123'), createVarRenamer())).toBe('"0123"');
    expect(assembleJs(prop('0.123'), createVarRenamer())).toBe('"0.123"');
  });
});

describe('propAccess', () => {

  test('compiles identifier', () => {
    expect(assembleJs(propAccess('a', 'okay'), createVarRenamer())).toBe('a.okay');
    expect(assembleJs(propAccess('a', '$okay'), createVarRenamer())).toBe('a.$okay');
    expect(assembleJs(propAccess('a', ' _okay'), createVarRenamer())).toBe('a[" _okay"]');
    expect(assembleJs(propAccess('a', '#$%@'), createVarRenamer())).toBe('a["#$%@"]');
    expect(assembleJs(propAccess('a', ''), createVarRenamer())).toBe('a[""]');
  });

  test('compiles array index', () => {
    expect(assembleJs(propAccess('a', '123'), createVarRenamer())).toBe('a[123]');
    expect(assembleJs(propAccess('a', '0'), createVarRenamer())).toBe('a[0]');
    expect(assembleJs(propAccess('a', '0123'), createVarRenamer())).toBe('a["0123"]');
    expect(assembleJs(propAccess('a', '0.123'), createVarRenamer())).toBe('a["0.123"]');
  });

  test('compiles optional identifier', () => {
    expect(assembleJs(propAccess('a', 'okay', true), createVarRenamer())).toBe('a?.okay');
  });

  test('compiles optional array index', () => {
    expect(assembleJs(propAccess('a', '123', true), createVarRenamer())).toBe('a?.[123]');
  });
});

describe('docComment', () => {

  test('returns an empty string for an empty comment', () => {
    expect(assembleJs(docComment(null), createVarRenamer())).toBe('');
    expect(assembleJs(docComment(undefined), createVarRenamer())).toBe('');
    expect(assembleJs(docComment(''), createVarRenamer())).toBe('');
  });

  test('returns a doc comment', () => {
    expect(assembleJs(docComment('Okay'), createVarRenamer())).toBe('\n/**\n * Okay\n */\n');
    expect(assembleJs(docComment(0), createVarRenamer())).toBe('\n/**\n * 0\n */\n');
  });

  test('returns a multiline doc comment', () => {
    expect(assembleJs(docComment('Okay\nYay'), createVarRenamer())).toBe('\n/**\n * Okay\n * Yay\n */\n');
  });
});

describe('comment', () => {

  test('returns an empty string for an empty comment', () => {
    expect(assembleJs(comment(null), createVarRenamer())).toBe('');
    expect(assembleJs(comment(undefined), createVarRenamer())).toBe('');
    expect(assembleJs(comment(''), createVarRenamer())).toBe('');
  });

  test('returns a comment', () => {
    expect(assembleJs(comment('Okay'), createVarRenamer())).toBe('// Okay\n');
    expect(assembleJs(comment(0), createVarRenamer())).toBe('// 0\n');
  });

  test('returns a multiline comment', () => {
    expect(assembleJs(comment('Okay\nYay'), createVarRenamer())).toBe('// Okay\n// Yay\n');
  });
});
