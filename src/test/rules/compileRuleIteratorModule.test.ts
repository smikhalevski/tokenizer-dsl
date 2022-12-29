import { all, char, compileRuleIteratorModule, externalValue } from '../../main';

describe('compileRuleIteratorModule', () => {
  test('compiles char reader', () => {
    const src = compileRuleIteratorModule([{ reader: char(['a']) }], { typingsEnabled: true });

    expect(src).toBe(
      'import type {RuleIterator} from "tokenizer-dsl";const e:RuleIterator<any,any,any>=function(a,b,c,d){var f=a.chunk,g=a.offset,h=false,i,j=g,k=f.length;while(j<k){var l;var m;l=j<f.length&&(m=f.charCodeAt(j),m===97)?j+1:-1;if(l>j){if(h){b(i,f,g,j-g,c,a);h=false}a.offset=g=j;h=true;i=undefined;j=l;continue}break}if(d)return;if(h){b(i,f,g,j-g,c,a);}a.offset=j;};export default e;'
    );
  });

  test('compiles named tokens', () => {
    const src = compileRuleIteratorModule([
      { type: 'TYPE_A', reader: char(['a']) },
      { type: 'TYPE_B', reader: char(['b']) },
    ]);

    expect(src).toBe(
      'export default (function(){const e="TYPE_A";const f="TYPE_B";return function(a,b,c,d){var g=a.chunk,h=a.offset,i=false,j,k=h,l=g.length;while(k<l){var m;var n;m=k<g.length&&(n=g.charCodeAt(k),n===97)?k+1:-1;if(m>k){if(i){b(j,g,h,k-h,c,a);i=false}a.offset=h=k;i=true;j=e;k=m;continue}var o;m=k<g.length&&(o=g.charCodeAt(k),o===98)?k+1:-1;if(m>k){if(i){b(j,g,h,k-h,c,a);i=false}a.offset=h=k;i=true;j=f;k=m;continue}break}if(d)return;if(i){b(j,g,h,k-h,c,a);}a.offset=k;}})();'
    );
  });

  test('compiles char reader with typings', () => {
    const src = compileRuleIteratorModule([{ reader: char(['a']) }], { typingsEnabled: true });

    expect(src).toBe(
      'import type {RuleIterator} from "tokenizer-dsl";const e:RuleIterator<any,any,any>=function(a,b,c,d){var f=a.chunk,g=a.offset,h=false,i,j=g,k=f.length;while(j<k){var l;var m;l=j<f.length&&(m=f.charCodeAt(j),m===97)?j+1:-1;if(l>j){if(h){b(i,f,g,j-g,c,a);h=false}a.offset=g=j;h=true;i=undefined;j=l;continue}break}if(d)return;if(h){b(i,f,g,j-g,c,a);}a.offset=j;};export default e;'
    );
  });

  test('compiles external reader that is a default export', () => {
    const src = compileRuleIteratorModule([{ reader: externalValue('./foo') }], { typingsEnabled: true });

    expect(src).toBe(
      'import type {RuleIterator} from "tokenizer-dsl";import e from"./foo";const f:RuleIterator<any,any,any>=function(a,b,c,d){var g=a.chunk,h=a.offset,i=false,j,k=h,l=g.length;while(k<l){var m;m=e(g,k,c);if(m>k){if(i){b(j,g,h,k-h,c,a);i=false}a.offset=h=k;i=true;j=undefined;k=m;continue}break}if(d)return;if(i){b(j,g,h,k-h,c,a);}a.offset=k;};export default f;'
    );
  });

  test('compiles external reader that is a named export', () => {
    const src = compileRuleIteratorModule([{ reader: externalValue('./foo', 'Foo') }]);

    expect(src).toBe(
      'import {Foo as e} from"./foo";export default function(a,b,c,d){var f=a.chunk,g=a.offset,h=false,i,j=g,k=f.length;while(j<k){var l;l=e(f,j,c);if(l>j){if(h){b(i,f,g,j-g,c,a);h=false}a.offset=g=j;h=true;i=undefined;j=l;continue}break}if(d)return;if(h){b(i,f,g,j-g,c,a);}a.offset=j;};'
    );
  });

  test('compiles external target stage', () => {
    const src = compileRuleIteratorModule([{ reader: char(['a']), to: externalValue('./foo') }]);

    expect(src).toBe(
      'import e from"./foo";export default function(a,b,c,d){var f=a.chunk,g=a.offset,h=false,i,j=g,k=f.length;while(j<k){var l;var m;l=j<f.length&&(m=f.charCodeAt(j),m===97)?j+1:-1;if(l>j){if(h){b(i,f,g,j-g,c,a);h=false}a.offset=g=j;h=true;i=undefined;n=e(f,j,l-j,c,a);j=l;continue}break}if(d)return;if(h){b(i,f,g,j-g,c,a);}a.offset=j;};'
    );
  });

  test('compiles external token type', () => {
    const src = compileRuleIteratorModule([{ type: externalValue('./foo'), reader: char(['a']) }]);

    expect(src).toBe(
      'import e from"./foo";export default function(a,b,c,d){var f=a.chunk,g=a.offset,h=false,i,j=g,k=f.length;while(j<k){var l;var m;l=j<f.length&&(m=f.charCodeAt(j),m===97)?j+1:-1;if(l>j){if(h){b(i,f,g,j-g,c,a);h=false}a.offset=g=j;h=true;i=e(f,j,l-j,c,a);j=l;continue}break}if(d)return;if(h){b(i,f,g,j-g,c,a);}a.offset=j;};'
    );
  });

  test('compiles combination of built-in and external readers', () => {
    const src = compileRuleIteratorModule([{ reader: all(externalValue('./foo')) }]);

    expect(src).toBe(
      'import e from"./foo";export default function(a,b,c,d){var f=a.chunk,g=a.offset,h=false,i,j=g,k=f.length;while(j<k){var l;l=j;var m=j;do{l=m;m=e(f,l,c);}while(m>l)if(l>j){if(h){b(i,f,g,j-g,c,a);h=false}a.offset=g=j;h=true;i=undefined;j=l;continue}break}if(d)return;if(h){b(i,f,g,j-g,c,a);}a.offset=j;};'
    );
  });
});
