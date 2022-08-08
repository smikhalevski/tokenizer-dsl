import { char, compileTokenizerModule } from '../main';

describe('compileTokenizerModule', () => {
  test('', () => {
    const src = compileTokenizerModule([
      { type: 'TYPE_A', reader: char(['a']) },
    ]);

    expect(src).toBe('import{createTokenizerForRuleIterator}from"tokenizer-dsl";export default createTokenizerForRuleIterator(function(){var _4="TYPE_A";return function(_0,_1,_2,_3){var _5=_0.chunk,_6=_0.offset,_7=false,_8,_9=_6,_10=_5.length;while(_9<_10){var _11;var _12;_11=_9<_5.length&&(_12=_5.charCodeAt(_9),_12===97)?_9+1:-1;if(_11>_9){if(_7){_1(_8,_5,_6,_9-_6,_2,_0);_7=false}_0.offset=_6=_9;_7=true;_8=_4;_9=_11;continue}break}if(_3)return;if(_7){_1(_8,_5,_6,_9-_6,_2,_0);}_0.offset=_9;}}());');
  });
});
