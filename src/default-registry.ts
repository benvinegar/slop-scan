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
import { placeholderCommentsRule } from "./rules/comments/placeholder-comments";
import { asyncNoiseRule } from "./rules/defensive/async-noise";
import { needlessTryCatchRule } from "./rules/defensive/needless-try-catch";
import { barrelDensityRule } from "./rules/structure/barrel-density";
import { directoryFanoutHotspotRule } from "./rules/structure/directory-fanout-hotspot";
import { duplicateFunctionSignaturesRule } from "./rules/structure/duplicate-function-signatures";
import { overFragmentationRule } from "./rules/structure/over-fragmentation";
import { passThroughWrappersRule } from "./rules/structure/pass-through-wrappers";
import { duplicateMockSetupRule } from "./rules/tests/duplicate-mock-setup";

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

  registry.registerRule(placeholderCommentsRule);
  registry.registerRule(asyncNoiseRule);
  registry.registerRule(needlessTryCatchRule);
  registry.registerRule(barrelDensityRule);
  registry.registerRule(passThroughWrappersRule);
  registry.registerRule(duplicateFunctionSignaturesRule);
  registry.registerRule(overFragmentationRule);
  registry.registerRule(directoryFanoutHotspotRule);
  registry.registerRule(duplicateMockSetupRule);

  registry.registerReporter(textReporter);
  registry.registerReporter(jsonReporter);
  registry.registerReporter(lintReporter);
  return registry;
}
