import { CodeBindings, Var } from 'codedegen';
import { createVar } from '../utils';
import { Reader, ReaderCodegen } from './reader-types';
import { createCodeBindings } from './reader-utils';

/**
 * Creates a reader that matches a substring.
 *
 * @param re The `RegExp` to match.
 */
export function regex(re: RegExp): Reader<any> {
  return new RegexReader(re);
}

export class RegexReader implements ReaderCodegen {

  re;

  constructor(re: RegExp) {
    this.re = re.global || re.sticky ? re : new RegExp(re, re.flags + 'g');
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const reVar = createVar();

    return createCodeBindings(
      [
        reVar, '.lastIndex=', offsetVar, ';',
        resultVar, '=', reVar, '.test(', inputVar, ')?', reVar, '.lastIndex:-1;',
      ],
      [[reVar, this.re]],
    );
  }
}
