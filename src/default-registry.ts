import { Registry } from "./core/registry";
import { astFactProvider } from "./facts/ast";
import { commentsFactProvider } from "./facts/comments";
import { directoryMetricsFactProvider } from "./facts/directory-metrics";
import { exportsFactProvider } from "./facts/exports";
import { functionDuplicationFactProvider } from "./facts/function-duplication";
import { functionsFactProvider } from "./facts/functions";
import { testDuplicationFactProvider } from "./facts/test-duplication";
import { testMockSetupsFactProvider } from "./facts/test-mock-setups";
import { tryCatchFactProvider } from "./facts/try-catch";
import { javascriptLikeLanguage } from "./languages/javascript-like";
import { jsonReporter } from "./reporters/json";
import { lintReporter } from "./reporters/lint";
import { textReporter } from "./reporters/text";
import { asyncNoiseRule } from "./rules/async-noise";
import { emptyCatchRule } from "./rules/empty-catch";
import { errorObscuringRule } from "./rules/error-obscuring";
import { errorSwallowingRule } from "./rules/error-swallowing";
import { promiseDefaultFallbacksRule } from "./rules/promise-default-fallbacks";
import { genericStatusEnvelopesRule } from "./rules/generic-status-envelopes";
import { genericRecordCastsRule } from "./rules/generic-record-casts";
import { stringifiedUnknownErrorsRule } from "./rules/stringified-unknown-errors";
import { duplicateFunctionSignaturesRule } from "./rules/duplicate-function-signatures";
import { passThroughWrappersRule } from "./rules/pass-through-wrappers";
import { duplicateMockSetupRule } from "./rules/duplicate-mock-setup";

export function createDefaultRegistry(): Registry {
  const registry = new Registry();
  registry.registerLanguage(javascriptLikeLanguage);

  registry.registerFactProvider(astFactProvider);
  registry.registerFactProvider(commentsFactProvider);
  registry.registerFactProvider(functionsFactProvider);
  registry.registerFactProvider(exportsFactProvider);
  registry.registerFactProvider(functionDuplicationFactProvider);
  registry.registerFactProvider(tryCatchFactProvider);
  registry.registerFactProvider(testMockSetupsFactProvider);
  registry.registerFactProvider(directoryMetricsFactProvider);
  registry.registerFactProvider(testDuplicationFactProvider);

  registry.registerRule(asyncNoiseRule);
  registry.registerRule(errorSwallowingRule);
  registry.registerRule(errorObscuringRule);
  registry.registerRule(emptyCatchRule);
  registry.registerRule(promiseDefaultFallbacksRule);
  registry.registerRule(genericStatusEnvelopesRule);
  registry.registerRule(genericRecordCastsRule);
  registry.registerRule(stringifiedUnknownErrorsRule);
  registry.registerRule(passThroughWrappersRule);
  registry.registerRule(duplicateFunctionSignaturesRule);
  registry.registerRule(duplicateMockSetupRule);

  registry.registerReporter(textReporter);
  registry.registerReporter(jsonReporter);
  registry.registerReporter(lintReporter);
  return registry;
}
