import {InternalTakerType} from '../../main';
import {createVar} from '../../main/code';
import {compileInternalTaker} from '../../main/takers';

describe('compileInternalTaker', () => {

  test('compiles taker', () => {
    const boundVar = createVar();

    const taker = compileInternalTaker(InternalTakerType.NEVER, (inputVar, offsetVar, resultVar) => [
      resultVar, '=', inputVar, '.charCodeAt(', offsetVar, ')+', boundVar, ';'
    ], [[boundVar, 1]]);

    expect(taker('a', 0)).toBe(98);
  });
});
