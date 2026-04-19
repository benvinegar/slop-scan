# Benchmarks

This directory contains **recreatable pinned benchmark sets** for `slop-scan`.

## Why this exists

The analyzer is heuristic, so we need benchmark cohorts that can be rerun later against the exact same upstream revisions.

A pinned benchmark set gives us:

- exact repo membership
- exact commit SHAs
- saved snapshot results
- a generated markdown report
- a reproducible blended score that summarizes the six normalized metrics

## Included set

- `benchmarks/sets/known-ai-vs-solid-oss.json`

This set compares:

- a cohort of known AI-generated JS/TS repos
- against older, well-regarded JS/TS OSS repos

AI provenance may come from public README disclosures or user-provided provenance used during benchmark calibration.

The generated report also includes a **blended score**: the geometric mean of each repo's six normalized-metric ratios versus the mature OSS medians, rescaled so the mature OSS median is 1.00.

## Reproduce the saved snapshot

Fetch the pinned checkouts:

```bash
bun run benchmark:fetch
```

Scan them with the analyzer's **default config**:

```bash
bun run benchmark:scan
```

Regenerate the markdown report:

```bash
bun run benchmark:report
```

Or do all three:

```bash
bun run benchmark:update
```

## Rolling history

A separate rolling-history pipeline tracks the same repos at the **default-branch revision that existed at each recorded run time**.

Refresh it locally with:

```bash
bun run benchmark:history
```

Backfill an earlier weekly point with:

```bash
bun run benchmark:history --recorded-at 2026-04-06T12:00:00Z
```

That writes:

- per-repo JSONL histories under `benchmarks/history/known-ai-vs-solid-oss/*.jsonl`
- a latest aggregate summary at `benchmarks/history/known-ai-vs-solid-oss/latest.json`
- a generated markdown summary at `reports/known-ai-vs-solid-oss-history.md`

If a repo did not exist yet for an older backfill date, that weekly point is skipped instead of fabricating a datapoint.

The rolling history is intentionally separate from the pinned benchmark snapshot so reproducible benchmark claims still point at exact SHAs.

## Per-rule signal benchmark

A separate pinned mini cohort runs each built-in rule **in isolation** so we can compare which rules separate the explicit-AI and mature-OSS cohorts most cleanly.

Refresh it locally with:

```bash
bun run benchmark:rules
```

That writes:

- an aggregate JSON summary at `benchmarks/results/rule-signal-mini.json`
- a markdown leaderboard/report at `reports/rule-signal-mini.md`
- benchmark summary sections into each `src/rules/*/README.md`

## Artifacts

For the current pinned set:

- manifest: `benchmarks/sets/known-ai-vs-solid-oss.json`
- saved snapshot: `benchmarks/results/known-ai-vs-solid-oss.json`
- generated report: `reports/known-ai-vs-solid-oss-benchmark.md`

For rolling history:

- per-repo JSONL: `benchmarks/history/known-ai-vs-solid-oss/*.jsonl`
- latest summary: `benchmarks/history/known-ai-vs-solid-oss/latest.json`
- generated history report: `reports/known-ai-vs-solid-oss-history.md`

For per-rule signal benchmarking:

- manifest: `benchmarks/sets/rule-signal-mini.json`
- summary: `benchmarks/results/rule-signal-mini.json`
- generated report: `reports/rule-signal-mini.md`
- per-rule docs: `src/rules/*/README.md`

## Notes

- Checkouts are stored under `benchmarks/.cache/` and are gitignored.
- The benchmark currently scans only JS/TS-family files.
- Mixed-language repos are therefore only partially represented.
- Saved snapshots should be regenerated intentionally when the benchmark set or analyzer changes.
