import { PLUGIN_API_VERSION as pluginApiVersion } from "./plugin";

export const PLUGIN_API_VERSION = pluginApiVersion;

export { FINDING_FINGERPRINT_VERSION, createFindingDeltaIdentity } from "./delta-identity";
export { diffReports, formatDeltaText, parseFailOn, shouldFailDelta } from "./delta";
export { formatHelp, run } from "./cli";
export { DEFAULT_CONFIG, loadConfig, loadConfigFile, resolveRuleConfigDefaults } from "./config";
export { analyzeRepository } from "./core/engine";
export { Registry } from "./core/registry";
export { createDefaultRegistry } from "./default-registry";
export { defineConfig, definePlugin } from "./plugin";
export {
  REPORT_SCHEMA_VERSION,
  TOOL_NAME,
  TOOL_VERSION,
  buildReportMetadata,
  createConfigHash,
  getReportMetadata,
} from "./report-metadata";
export type {
  AnalyzerConfig,
  ConfigOverride,
  LoadedConfigFile,
  ResolvedRuleConfig,
  RuleConfig,
} from "./config";
export type {
  AnalysisResult,
  AnalysisSummary,
  AnalyzerRuntime,
  DirectoryRecord,
  FactProvider,
  FactStoreReader,
  FileRecord,
  Finding,
  FindingDeltaIdentity,
  FindingDeltaOccurrenceIdentity,
  FindingLocation,
  LanguagePlugin,
  ProviderContext,
  ReporterPlugin,
  ReportMetadata,
  ReportPluginMetadata,
  RulePlugin,
  Scope,
} from "./core/types";
export type {
  DeltaChange,
  DeltaEndpoint,
  DeltaFailOn,
  DeltaOccurrenceSnapshot,
  DeltaPath,
  DeltaReport,
  DeltaRuleSummary,
  DeltaStatus,
  DeltaSummary,
  DeltaWarning,
  FindingOccurrence,
} from "./delta";
export type { ConfigFile, LoadedPlugin, PluginReference, SlopScanPlugin } from "./plugin";
