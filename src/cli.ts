import path from "node:path";
import { loadConfig } from "./config";

export function formatHelp(): string {
  return [
    "repo-slop-analyzer",
    "",
    "Usage:",
    "  bun run src/cli.ts scan [path] [--json]",
    "  bun run src/cli.ts --help",
    "",
    "Current status:",
    "  Project scaffolded. Scan engine will land in the next phase.",
  ].join("\n");
}

export async function run(argv: string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    console.log(formatHelp());
    return 0;
  }

  const [command, targetArg = "."] = argv;

  if (command !== "scan") {
    console.error(`Unknown command: ${command}`);
    console.error("Run with --help to see supported commands.");
    return 1;
  }

  const rootDir = path.resolve(targetArg);
  const config = await loadConfig(rootDir);

  const report = {
    status: "scaffold",
    rootDir,
    config,
    message: "Scan engine not implemented yet. Foundation is ready.",
  };

  if (argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("repo-slop-analyzer scaffold");
    console.log(`root: ${rootDir}`);
    console.log(`ignore patterns: ${config.ignores.length}`);
    console.log(report.message);
  }

  return 0;
}

if (import.meta.main) {
  const exitCode = await run(process.argv.slice(2));
  process.exit(exitCode);
}
