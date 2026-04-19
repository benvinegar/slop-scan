/**
 * Shared git checkout helpers for pinned benchmark workflows.
 *
 * Both the main pinned benchmark and the per-rule signal benchmark need to
 * materialize exact upstream SHAs locally before scanning. Keeping the git
 * plumbing here avoids small behavior drift between the CLI entrypoints.
 */
import { spawnSync } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import type { BenchmarkRepoSpec } from "./types";

/**
 * Runs a git command and returns trimmed stdout.
 *
 * Benchmarks are meant to be reproducible, so failures should be loud and
 * include both stdout and stderr for debugging.
 */
function run(command: string, args: string[], cwd?: string): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(
      [`Command failed: ${command} ${args.join(" ")}`, result.stdout, result.stderr]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result.stdout.trim();
}

/**
 * Checks whether a path exists without treating a missing path as exceptional.
 */
function pathExists(targetPath: string): Promise<boolean> {
  return access(targetPath).then(
    () => true,
    () => false,
  );
}

/**
 * Reads the currently checked out commit SHA for an existing local checkout.
 */
export function readHeadRef(checkoutPath: string): string {
  return run("git", ["rev-parse", "HEAD"], checkoutPath);
}

/**
 * Ensures every repo in a pinned benchmark set exists locally at its exact ref.
 *
 * Existing clones are reused, but their origin URL, fetched refs, working tree,
 * and HEAD are all reset so reruns stay deterministic.
 */
export async function ensurePinnedCheckouts(
  checkoutsDir: string,
  repos: BenchmarkRepoSpec[],
): Promise<void> {
  await mkdir(checkoutsDir, { recursive: true });

  for (const repo of repos) {
    const checkoutPath = path.join(checkoutsDir, repo.id);
    const gitPath = path.join(checkoutPath, ".git");

    console.log(`\n==> ${repo.id} (${repo.repo})`);

    if (!(await pathExists(gitPath))) {
      console.log(`cloning ${repo.url}`);
      run("git", ["clone", "--filter=blob:none", "--no-checkout", repo.url, checkoutPath]);
    }

    run("git", ["remote", "set-url", "origin", repo.url], checkoutPath);
    run("git", ["fetch", "--force", "--prune", "--filter=blob:none", "origin"], checkoutPath);
    run("git", ["checkout", "--force", "--detach", repo.ref], checkoutPath);
    run("git", ["reset", "--hard", repo.ref], checkoutPath);
    run("git", ["clean", "-fdx"], checkoutPath);

    const actualRef = readHeadRef(checkoutPath);
    if (actualRef !== repo.ref) {
      throw new Error(`Pinned ref mismatch for ${repo.id}: expected ${repo.ref}, got ${actualRef}`);
    }

    console.log(`ready at ${actualRef.slice(0, 7)}`);
  }
}
