import packageJson from "../package.json";
import type { AnalyzerConfig } from "./config";
import type { AnalysisResult, ReportMetadata, ReportPluginMetadata } from "./core/types";
import { FINDING_FINGERPRINT_VERSION } from "./delta-identity";
import type { LoadedPlugin } from "./plugin";
import { stableHash } from "./stable-hash";

export const REPORT_SCHEMA_VERSION = 2;
export const TOOL_NAME = "slop-scan";
export const TOOL_VERSION = typeof packageJson.version === "string" ? packageJson.version : "0.0.0";

function buildPluginMetadata(plugins: LoadedPlugin[]): ReportPluginMetadata[] {
  return plugins
    .map((plugin) => ({
      namespace: plugin.namespace,
      name: plugin.plugin.meta.name,
      version: plugin.plugin.meta.version ?? null,
      source: plugin.source,
    }))
    .sort(
      (left, right) =>
        left.namespace.localeCompare(right.namespace) ||
        left.name.localeCompare(right.name) ||
        (left.version ?? "").localeCompare(right.version ?? "") ||
        left.source.localeCompare(right.source),
    );
}

export function createConfigHash(
  config: AnalyzerConfig,
  plugins: ReportPluginMetadata[] = [],
): string {
  return stableHash(
    {
      config,
      plugins: plugins.map((plugin) => ({
        namespace: plugin.namespace,
        name: plugin.name,
        version: plugin.version,
        source: plugin.source,
      })),
    },
    16,
  );
}

export function buildReportMetadata(
  config: AnalyzerConfig,
  plugins: LoadedPlugin[] = [],
): ReportMetadata {
  const pluginMetadata = buildPluginMetadata(plugins);

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    tool: {
      name: TOOL_NAME,
      version: TOOL_VERSION,
    },
    configHash: createConfigHash(config, pluginMetadata),
    findingFingerprintVersion: FINDING_FINGERPRINT_VERSION,
    plugins: pluginMetadata,
  };
}

export function getReportMetadata(result: AnalysisResult): ReportMetadata {
  if (!result.metadata) {
    return buildReportMetadata(result.config);
  }

  return {
    ...result.metadata,
    findingFingerprintVersion:
      typeof result.metadata.findingFingerprintVersion === "number"
        ? result.metadata.findingFingerprintVersion
        : 0,
  };
}
