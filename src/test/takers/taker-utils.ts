import {createVar} from '../../main/code';
import {createInternalTaker} from '../../main/takers';

describe('compileInternalTaker', () => {

  test('compiles taker', () => {
    const boundVar = createVar();

    const taker = createInternalTaker(NEVER_TYPE, (inputVar, offsetVar, resultVar) => [
      resultVar, '=', inputVar, '.charCodeAt(', offsetVar, ')+', boundVar, ';'
    ], [[boundVar, 1]]);

    expect(taker('a', 0)).toBe(98);
  });
});
