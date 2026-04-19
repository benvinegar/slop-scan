#!/usr/bin/env bash
set -euo pipefail

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

bun run format:check >"$tmpdir/format.log" 2>&1 || {
  tail -50 "$tmpdir/format.log"
  exit 1
}

bun test tests/promise-default-fallbacks.test.ts tests/rule-signal-benchmark.test.ts >"$tmpdir/tests.log" 2>&1 || {
  tail -80 "$tmpdir/tests.log"
  exit 1
}
