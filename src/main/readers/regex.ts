import {CodeBindings, createVar, Var} from 'codedegen';
import {Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, NO_MATCH} from './reader-utils';

/**
 * Creates a reader that matches a substring.
 *
 * @param re The `RegExp` to match.
 */
export function regex(re: RegExp): Reader<any, any> {
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
          resultVar, '=', reVar, '.test(', inputVar, ')?', reVar, '.lastIndex:', NO_MATCH, ';',
        ],
        [[reVar, this.re]],
    );
  }
}
