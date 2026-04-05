import { access, readFile } from "node:fs/promises";
import path from "node:path";

export interface RuleConfig {
  enabled?: boolean;
  weight?: number;
}

export interface AnalyzerConfig {
  ignores: string[];
  rules: Record<string, RuleConfig>;
  thresholds: Record<string, number>;
}

export const DEFAULT_CONFIG: AnalyzerConfig = {
  ignores: [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/coverage/**",
    "**/*.generated.*",
  ],
  rules: {},
  thresholds: {},
};

export async function loadConfig(rootDir: string): Promise<AnalyzerConfig> {
  const configPath = path.join(rootDir, "repo-slop.config.json");

  try {
    await access(configPath);
  } catch {
    return DEFAULT_CONFIG;
  }

  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw) as Partial<AnalyzerConfig>;

  return {
    ignores: parsed.ignores ?? DEFAULT_CONFIG.ignores,
    rules: parsed.rules ?? DEFAULT_CONFIG.rules,
    thresholds: parsed.thresholds ?? DEFAULT_CONFIG.thresholds,
  };
}
