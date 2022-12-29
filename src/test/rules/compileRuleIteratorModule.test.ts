import { all, char, compileRuleIteratorModule, externalValue } from '../../main';

describe('compileRuleIteratorModule', () => {
  test('compiles char reader', () => {
    const src = compileRuleIteratorModule([{ reader: char(['a']) }], { typingsEnabled: true });

    expect(src).toBe(
      'import type {RuleIterator} from "tokenizer-dsl";const _4:RuleIterator<any,any,any>=function(_0,_1,_2,_3){var _5=_0.chunk,_6=_0.offset,_7=false,_8,_9=_6,_10=_5.length;while(_9<_10){var _11;var _12;_11=_9<_5.length&&(_12=_5.charCodeAt(_9),_12===97)?_9+1:-1;if(_11>_9){if(_7){_1(_8,_5,_6,_9-_6,_2,_0);_7=false}_0.offset=_6=_9;_7=true;_8=undefined;_9=_11;continue}break}if(_3)return;if(_7){_1(_8,_5,_6,_9-_6,_2,_0);}_0.offset=_9;};export default _4;'
    );
  });

  test('compiles named tokens', () => {
    const src = compileRuleIteratorModule([
      { type: 'TYPE_A', reader: char(['a']) },
      { type: 'TYPE_B', reader: char(['b']) },
    ]);

    expect(src).toBe(
      'export default (function(){const _4="TYPE_A";const _5="TYPE_B";return function(_0,_1,_2,_3){var _6=_0.chunk,_7=_0.offset,_8=false,_9,_10=_7,_11=_6.length;while(_10<_11){var _12;var _13;_12=_10<_6.length&&(_13=_6.charCodeAt(_10),_13===97)?_10+1:-1;if(_12>_10){if(_8){_1(_9,_6,_7,_10-_7,_2,_0);_8=false}_0.offset=_7=_10;_8=true;_9=_4;_10=_12;continue}var _14;_12=_10<_6.length&&(_14=_6.charCodeAt(_10),_14===98)?_10+1:-1;if(_12>_10){if(_8){_1(_9,_6,_7,_10-_7,_2,_0);_8=false}_0.offset=_7=_10;_8=true;_9=_5;_10=_12;continue}break}if(_3)return;if(_8){_1(_9,_6,_7,_10-_7,_2,_0);}_0.offset=_10;}})();'
    );
  });

  test('compiles char reader with typings', () => {
    const src = compileRuleIteratorModule([{ reader: char(['a']) }], { typingsEnabled: true });

    expect(src).toBe(
      'import type {RuleIterator} from "tokenizer-dsl";const _4:RuleIterator<any,any,any>=function(_0,_1,_2,_3){var _5=_0.chunk,_6=_0.offset,_7=false,_8,_9=_6,_10=_5.length;while(_9<_10){var _11;var _12;_11=_9<_5.length&&(_12=_5.charCodeAt(_9),_12===97)?_9+1:-1;if(_11>_9){if(_7){_1(_8,_5,_6,_9-_6,_2,_0);_7=false}_0.offset=_6=_9;_7=true;_8=undefined;_9=_11;continue}break}if(_3)return;if(_7){_1(_8,_5,_6,_9-_6,_2,_0);}_0.offset=_9;};export default _4;'
    );
  });

  test('compiles external reader that is a default export', () => {
    const src = compileRuleIteratorModule([{ reader: externalValue('./foo') }], { typingsEnabled: true });

    expect(src).toBe(
      'import type {RuleIterator} from "tokenizer-dsl";import _4 from"./foo";const _5:RuleIterator<any,any,any>=function(_0,_1,_2,_3){var _6=_0.chunk,_7=_0.offset,_8=false,_9,_10=_7,_11=_6.length;while(_10<_11){var _12;_12=_4(_6,_10,_2);if(_12>_10){if(_8){_1(_9,_6,_7,_10-_7,_2,_0);_8=false}_0.offset=_7=_10;_8=true;_9=undefined;_10=_12;continue}break}if(_3)return;if(_8){_1(_9,_6,_7,_10-_7,_2,_0);}_0.offset=_10;};export default _5;'
    );
  });

  test('compiles external reader that is a named export', () => {
    const src = compileRuleIteratorModule([{ reader: externalValue('./foo', 'Foo') }]);

    expect(src).toBe(
      'import {Foo as _4} from"./foo";export default function(_0,_1,_2,_3){var _5=_0.chunk,_6=_0.offset,_7=false,_8,_9=_6,_10=_5.length;while(_9<_10){var _11;_11=_4(_5,_9,_2);if(_11>_9){if(_7){_1(_8,_5,_6,_9-_6,_2,_0);_7=false}_0.offset=_6=_9;_7=true;_8=undefined;_9=_11;continue}break}if(_3)return;if(_7){_1(_8,_5,_6,_9-_6,_2,_0);}_0.offset=_9;};'
    );
  });

  test('compiles external target stage', () => {
    const src = compileRuleIteratorModule([{ reader: char(['a']), to: externalValue('./foo') }]);

    expect(src).toBe(
      'import _4 from"./foo";export default function(_0,_1,_2,_3){var _5=_0.chunk,_6=_0.offset,_7=false,_8,_9=_6,_10=_5.length;while(_9<_10){var _11;var _12;_11=_9<_5.length&&(_12=_5.charCodeAt(_9),_12===97)?_9+1:-1;if(_11>_9){if(_7){_1(_8,_5,_6,_9-_6,_2,_0);_7=false}_0.offset=_6=_9;_7=true;_8=undefined;_13=_4(_5,_9,_11-_9,_2,_0);_9=_11;continue}break}if(_3)return;if(_7){_1(_8,_5,_6,_9-_6,_2,_0);}_0.offset=_9;};'
    );
  });

  test('compiles external token type', () => {
    const src = compileRuleIteratorModule([{ type: externalValue('./foo'), reader: char(['a']) }]);

    expect(src).toBe(
      'import _4 from"./foo";export default function(_0,_1,_2,_3){var _5=_0.chunk,_6=_0.offset,_7=false,_8,_9=_6,_10=_5.length;while(_9<_10){var _11;var _12;_11=_9<_5.length&&(_12=_5.charCodeAt(_9),_12===97)?_9+1:-1;if(_11>_9){if(_7){_1(_8,_5,_6,_9-_6,_2,_0);_7=false}_0.offset=_6=_9;_7=true;_8=_4(_5,_9,_11-_9,_2,_0);_9=_11;continue}break}if(_3)return;if(_7){_1(_8,_5,_6,_9-_6,_2,_0);}_0.offset=_9;};'
    );
  });

  test('compiles combination of built-in and external readers', () => {
    const src = compileRuleIteratorModule([{ reader: all(externalValue('./foo')) }]);

    expect(src).toBe(
      'import _4 from"./foo";export default function(_0,_1,_2,_3){var _5=_0.chunk,_6=_0.offset,_7=false,_8,_9=_6,_10=_5.length;while(_9<_10){var _11;_11=_9;var _12=_9;do{_11=_12;_12=_4(_5,_11,_2);}while(_12>_11)if(_11>_9){if(_7){_1(_8,_5,_6,_9-_6,_2,_0);_7=false}_0.offset=_6=_9;_7=true;_8=undefined;_9=_11;continue}break}if(_3)return;if(_7){_1(_8,_5,_6,_9-_6,_2,_0);}_0.offset=_9;};'
    );
  });
});
