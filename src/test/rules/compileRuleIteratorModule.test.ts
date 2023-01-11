import { all, char, compileRuleIteratorModule, externalValue } from '../../main';

describe('compileRuleIteratorModule', () => {
  test('compiles char reader', () => {
    const src = compileRuleIteratorModule([{ reader: char(['a']) }], { typingsEnabled: true });

    expect(src).toBe(
      'import type {RuleIterator} from "tokenizer-dsl";const ruleIterator:RuleIterator<any,any,any>=function(state,handler,context,streaming){var chunk=state.chunk,offset=state.offset,tokenPending=false,pendingTokenType,nextOffset=offset,chunkLength=chunk.length;while(nextOffset<chunkLength){var branchResult;var charCode;branchResult=nextOffset<chunk.length&&(charCode=chunk.charCodeAt(nextOffset),charCode===97)?nextOffset+1:-1;if(branchResult>nextOffset){if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);tokenPending=false}state.offset=offset=nextOffset;tokenPending=true;pendingTokenType=undefined;nextOffset=branchResult;continue}break}if(streaming)return;if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);}state.offset=nextOffset;};export default ruleIterator;'
    );
  });

  test('compiles named tokens', () => {
    const src = compileRuleIteratorModule([
      { type: 'TYPE_A', reader: char(['a']) },
      { type: 'TYPE_B', reader: char(['b']) },
    ]);

    expect(src).toBe(
      'export default (function(){const tokenType="TYPE_A";const tokenType2="TYPE_B";return function(state,handler,context,streaming){var chunk=state.chunk,offset=state.offset,tokenPending=false,pendingTokenType,nextOffset=offset,chunkLength=chunk.length;while(nextOffset<chunkLength){var branchResult;var charCode;branchResult=nextOffset<chunk.length&&(charCode=chunk.charCodeAt(nextOffset),charCode===97)?nextOffset+1:-1;if(branchResult>nextOffset){if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);tokenPending=false}state.offset=offset=nextOffset;tokenPending=true;pendingTokenType=tokenType;nextOffset=branchResult;continue}var charCode2;branchResult=nextOffset<chunk.length&&(charCode2=chunk.charCodeAt(nextOffset),charCode2===98)?nextOffset+1:-1;if(branchResult>nextOffset){if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);tokenPending=false}state.offset=offset=nextOffset;tokenPending=true;pendingTokenType=tokenType2;nextOffset=branchResult;continue}break}if(streaming)return;if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);}state.offset=nextOffset;}})();'
    );
  });

  test('compiles char reader with typings', () => {
    const src = compileRuleIteratorModule([{ reader: char(['a']) }], { typingsEnabled: true });

    expect(src).toBe(
      'import type {RuleIterator} from "tokenizer-dsl";const ruleIterator:RuleIterator<any,any,any>=function(state,handler,context,streaming){var chunk=state.chunk,offset=state.offset,tokenPending=false,pendingTokenType,nextOffset=offset,chunkLength=chunk.length;while(nextOffset<chunkLength){var branchResult;var charCode;branchResult=nextOffset<chunk.length&&(charCode=chunk.charCodeAt(nextOffset),charCode===97)?nextOffset+1:-1;if(branchResult>nextOffset){if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);tokenPending=false}state.offset=offset=nextOffset;tokenPending=true;pendingTokenType=undefined;nextOffset=branchResult;continue}break}if(streaming)return;if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);}state.offset=nextOffset;};export default ruleIterator;'
    );
  });

  test('compiles external reader that is a default export', () => {
    const src = compileRuleIteratorModule([{ reader: externalValue('./foo') }], { typingsEnabled: true });

    expect(src).toBe(
      'import type {RuleIterator} from "tokenizer-dsl";import reader from"./foo";const ruleIterator:RuleIterator<any,any,any>=function(state,handler,context,streaming){var chunk=state.chunk,offset=state.offset,tokenPending=false,pendingTokenType,nextOffset=offset,chunkLength=chunk.length;while(nextOffset<chunkLength){var branchResult;branchResult=reader(chunk,nextOffset,context);if(branchResult>nextOffset){if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);tokenPending=false}state.offset=offset=nextOffset;tokenPending=true;pendingTokenType=undefined;nextOffset=branchResult;continue}break}if(streaming)return;if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);}state.offset=nextOffset;};export default ruleIterator;'
    );
  });

  test('compiles external reader that is a named export', () => {
    const src = compileRuleIteratorModule([{ reader: externalValue('./foo', 'Foo') }]);

    expect(src).toBe(
      'import {Foo as reader} from"./foo";export default function(state,handler,context,streaming){var chunk=state.chunk,offset=state.offset,tokenPending=false,pendingTokenType,nextOffset=offset,chunkLength=chunk.length;while(nextOffset<chunkLength){var branchResult;branchResult=reader(chunk,nextOffset,context);if(branchResult>nextOffset){if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);tokenPending=false}state.offset=offset=nextOffset;tokenPending=true;pendingTokenType=undefined;nextOffset=branchResult;continue}break}if(streaming)return;if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);}state.offset=nextOffset;};'
    );
  });

  test('compiles external target stage', () => {
    const src = compileRuleIteratorModule([{ reader: char(['a']), to: externalValue('./foo') }]);

    expect(src).toBe(
      'import nextStage from"./foo";export default function(state,handler,context,streaming){var chunk=state.chunk,offset=state.offset,tokenPending=false,pendingTokenType,nextOffset=offset,chunkLength=chunk.length;while(nextOffset<chunkLength){var branchResult;var charCode;branchResult=nextOffset<chunk.length&&(charCode=chunk.charCodeAt(nextOffset),charCode===97)?nextOffset+1:-1;if(branchResult>nextOffset){if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);tokenPending=false}state.offset=offset=nextOffset;tokenPending=true;pendingTokenType=undefined;stage=nextStage(chunk,nextOffset,branchResult-nextOffset,context,state);nextOffset=branchResult;continue}break}if(streaming)return;if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);}state.offset=nextOffset;};'
    );
  });

  test('compiles external token type', () => {
    const src = compileRuleIteratorModule([{ type: externalValue('./foo'), reader: char(['a']) }]);

    expect(src).toBe(
      'import tokenType from"./foo";export default function(state,handler,context,streaming){var chunk=state.chunk,offset=state.offset,tokenPending=false,pendingTokenType,nextOffset=offset,chunkLength=chunk.length;while(nextOffset<chunkLength){var branchResult;var charCode;branchResult=nextOffset<chunk.length&&(charCode=chunk.charCodeAt(nextOffset),charCode===97)?nextOffset+1:-1;if(branchResult>nextOffset){if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);tokenPending=false}state.offset=offset=nextOffset;tokenPending=true;pendingTokenType=tokenType(chunk,nextOffset,branchResult-nextOffset,context,state);nextOffset=branchResult;continue}break}if(streaming)return;if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);}state.offset=nextOffset;};'
    );
  });

  test('compiles combination of built-in and external readers', () => {
    const src = compileRuleIteratorModule([{ reader: all(externalValue('./foo')) }]);

    expect(src).toBe(
      'import reader from"./foo";export default function(state,handler,context,streaming){var chunk=state.chunk,offset=state.offset,tokenPending=false,pendingTokenType,nextOffset=offset,chunkLength=chunk.length;while(nextOffset<chunkLength){var branchResult;branchResult=nextOffset;var readerResult=nextOffset;do{branchResult=readerResult;readerResult=reader(chunk,branchResult,context);}while(readerResult>branchResult)if(branchResult>nextOffset){if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);tokenPending=false}state.offset=offset=nextOffset;tokenPending=true;pendingTokenType=undefined;nextOffset=branchResult;continue}break}if(streaming)return;if(tokenPending){handler(pendingTokenType,chunk,offset,nextOffset-offset,context,state);}state.offset=nextOffset;};'
    );
  });
});
