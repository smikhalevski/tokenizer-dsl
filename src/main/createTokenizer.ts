import { compileRuleIterator, createRuleTree, Rule } from './rules';
import { createTokenizerForRuleIterator } from './createTokenizerForRuleIterator';
import { Tokenizer } from './tokenizer-types';

/**
 * Creates a new pure tokenizer function.
 *
 * @param rules The list of rules that tokenizer uses to read tokens from the input chunks.
 * @returns The tokenizer instance.
 *
 * @template Type The type of tokens emitted by the tokenizer.
 * @template Context The context that rules may consume.
 */
export function createTokenizer<Type, Context = void>(rules: Rule<Type, void, Context>[]): Tokenizer<Type, void, Context>;

/**
 * Creates a new pure tokenizer function.
 *
 * @param rules The list of rules that tokenizer uses to read tokens from the input chunks.
 * @param initialStage The initial state from which tokenization starts.
 * @returns The tokenizer instance.
 *
 * @template Type The type of tokens emitted by the tokenizer.
 * @template Stage The type of stages at which rules are applied.
 * @template Context The context that rules may consume.
 */
export function createTokenizer<Type, Stage, Context = void>(rules: Rule<Type, Stage, Context>[], initialStage: Stage): Tokenizer<Type, Stage, Context>;

export function createTokenizer(rules: Rule[], initialStage?: any) {
  return createTokenizerForRuleIterator(compileRuleIterator(createRuleTree(rules)), initialStage);
}
