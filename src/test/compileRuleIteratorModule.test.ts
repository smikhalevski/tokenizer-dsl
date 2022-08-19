import { all, char, compileRuleIteratorModule, imported } from '../main';

describe('compileRuleIteratorModule', () => {
  test('compiles char reader', () => {
    const src = compileRuleIteratorModule([
      { reader: char(['a']) },
    ]);

    expect(src).toBe('export default (function(){var _4=undefined;return function(_0,_1,_2,_3){var _5=_0.chunk,_6=_0.offset,_7=false,_8,_9=_6,_10=_5.length;while(_9<_10){var _11;var _12;_11=_9<_5.length&&(_12=_5.charCodeAt(_9),_12===97)?_9+1:-1;if(_11>_9){if(_7){_1(_8,_5,_6,_9-_6,_2,_0);_7=false}_0.offset=_6=_9;_7=true;_8=_4;_9=_11;continue}break}if(_3)return;if(_7){_1(_8,_5,_6,_9-_6,_2,_0);}_0.offset=_9;}}());');
  });

  test('compiles imported reader that is a default export', () => {
    const src = compileRuleIteratorModule([
      { reader: imported('./foo') },
    ]);

    expect(src).toBe('import _4 from"./foo";export default (function(){var _5=undefined;return function(_0,_1,_2,_3){var _6=_0.chunk,_7=_0.offset,_8=false,_9,_10=_7,_11=_6.length;while(_10<_11){var _12;_12=_4(_6,_10,_2);if(_12>_10){if(_8){_1(_9,_6,_7,_10-_7,_2,_0);_8=false}_0.offset=_7=_10;_8=true;_9=_5;_10=_12;continue}break}if(_3)return;if(_8){_1(_9,_6,_7,_10-_7,_2,_0);}_0.offset=_10;}}());');
  });

  test('compiles imported reader that is a named export', () => {
    const src = compileRuleIteratorModule([
      { reader: imported('./foo', 'Foo') },
    ]);

    expect(src).toBe('import {Foo as _4} from"./foo";export default (function(){var _5=undefined;return function(_0,_1,_2,_3){var _6=_0.chunk,_7=_0.offset,_8=false,_9,_10=_7,_11=_6.length;while(_10<_11){var _12;_12=_4(_6,_10,_2);if(_12>_10){if(_8){_1(_9,_6,_7,_10-_7,_2,_0);_8=false}_0.offset=_7=_10;_8=true;_9=_5;_10=_12;continue}break}if(_3)return;if(_8){_1(_9,_6,_7,_10-_7,_2,_0);}_0.offset=_10;}}());');
  });

  test('compiles imported target stage', () => {
    const src = compileRuleIteratorModule([
      { reader: char(['a']), to: imported('./foo') },
    ]);

    expect(src).toBe('import _4 from"./foo";export default (function(){var _5=undefined;return function(_0,_1,_2,_3){var _6=_0.chunk,_7=_0.offset,_8=false,_9,_10=_7,_11=_6.length;while(_10<_11){var _12;var _13;_12=_10<_6.length&&(_13=_6.charCodeAt(_10),_13===97)?_10+1:-1;if(_12>_10){if(_8){_1(_9,_6,_7,_10-_7,_2,_0);_8=false}_0.offset=_7=_10;_8=true;_9=_5;_14=_4(_6,_10,_12-_10,_2,_0);_10=_12;continue}break}if(_3)return;if(_8){_1(_9,_6,_7,_10-_7,_2,_0);}_0.offset=_10;}}());');
  });

  test('compiles imported token type', () => {
    const src = compileRuleIteratorModule([
      { type: imported('./foo'), reader: char(['a']) },
    ]);

    expect(src).toBe('import _4 from"./foo";export default (function(){return function(_0,_1,_2,_3){var _5=_0.chunk,_6=_0.offset,_7=false,_8,_9=_6,_10=_5.length;while(_9<_10){var _11;var _12;_11=_9<_5.length&&(_12=_5.charCodeAt(_9),_12===97)?_9+1:-1;if(_11>_9){if(_7){_1(_8,_5,_6,_9-_6,_2,_0);_7=false}_0.offset=_6=_9;_7=true;_8=_4(_5,_9,_11-_9,_2,_0);_9=_11;continue}break}if(_3)return;if(_7){_1(_8,_5,_6,_9-_6,_2,_0);}_0.offset=_9;}}());');
  });

  test('compiles combination of built-in and imported readers', () => {
    const src = compileRuleIteratorModule([
      { reader: all(imported('./foo')) },
    ]);

    expect(src).toBe('import _4 from"./foo";export default (function(){var _5=undefined;return function(_0,_1,_2,_3){var _6=_0.chunk,_7=_0.offset,_8=false,_9,_10=_7,_11=_6.length;while(_10<_11){var _12;_12=_10;var _13=_10;do{_12=_13;_13=_4(_6,_12,_2);}while(_13>_12)if(_12>_10){if(_8){_1(_9,_6,_7,_10-_7,_2,_0);_8=false}_0.offset=_7=_10;_8=true;_9=_5;_10=_12;continue}break}if(_3)return;if(_8){_1(_9,_6,_7,_10-_7,_2,_0);}_0.offset=_10;}}());');
  });
});
