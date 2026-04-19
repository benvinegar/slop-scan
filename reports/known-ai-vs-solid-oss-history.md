# Rolling benchmark history: Known AI repos vs older solid OSS repos

Latest update: 2026-04-13
History dir: `benchmarks/history/known-ai-vs-solid-oss/`
Pinned baseline snapshot: `benchmarks/results/known-ai-vs-solid-oss.json` (2026-04-17)
Pinned baseline analyzer version: 0.3.0

## Goal

Compare a cohort of known AI-generated JavaScript/TypeScript repos against well-regarded OSS repos, with the mature-OSS cohort pinned to the latest default-branch commit on or before 2025-01-01, using exact commit SHAs and normalized analyzer metrics. This rolling history tracks the same repos at the default-branch revision that existed at each recorded run time so the benchmark can show movement over time.

## Refresh

```bash
bun run benchmark:history
```

To backfill earlier weekly points honestly, rerun the history job with a past timestamp so each repo resolves the default-branch commit that existed at that time:

```bash
bun run benchmark:history --recorded-at 2026-04-06T12:00:00Z
```

## Latest analyzer revisions

- `0.3.0` @ `c64455e` — 18 latest repo snapshots

## Latest cohort medians

| Cohort | Repo count | Median current blended | Median score/file | Median findings/file |
|---|---:|---:|---:|---:|
| explicit-ai | 9 | **2.81** | 0.99 | 0.31 |
| mature-oss | 9 | **1.00** | 0.24 | 0.08 |

## AI cohort latest standings

| Repo | Points | Trend (pinned) | Latest ref | Current blended | Latest pinned | Highest pinned | Δ prev (pinned) | Δ first (pinned) | Score/file | Findings/file |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| [garrytan/gstack](https://github.com/garrytan/gstack) | 4 | █▃▄▁ | `main@c6e6a21` | **4.59** | **4.77** | **6.37** | -0.64 | -1.60 | 1.96 | 0.49 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | 4 | █▁▁█ | `main@c61f27d` | **3.76** | **3.91** | **3.91** | +0.51 | +0.01 | 1.23 | 0.33 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | 4 | ██▁▁ | `main@ea50862` | **3.26** | **3.39** | **3.40** | 0.00 | -0.02 | 1.00 | 0.44 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | 4 | █▂▁▂ | `main@06113d6` | **2.91** | **3.03** | **3.06** | +0.01 | -0.03 | 1.37 | 0.35 |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | 4 | ▁▁█▁ | `main@1de5610` | **2.81** | **2.92** | **3.15** | -0.23 | -0.01 | 0.99 | 0.31 |
| [FullAgent/fulling](https://github.com/FullAgent/fulling) | 4 | ██▁▁ | `main@d95060f` | **2.07** | **2.16** | **2.16** | 0.00 | 0.00 | 0.53 | 0.16 |
| [emdash-cms/emdash](https://github.com/emdash-cms/emdash) | 2 | █▁ | `main@a1dac00` | **1.94** | **2.01** | **2.17** | -0.16 | -0.16 | 0.70 | 0.21 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | 4 | ▇█▇▁ | `main@e81a621` | **1.85** | **1.93** | **1.99** | -0.06 | -0.06 | 0.47 | 0.14 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | 4 | ▁▄▄█ | `main@53242b4` | **1.46** | **1.51** | **1.51** | +0.44 | +0.71 | 0.48 | 0.17 |

## Mature OSS cohort latest standings

| Repo | Points | Trend (pinned) | Latest ref | Current blended | Latest pinned | Highest pinned | Δ prev (pinned) | Δ first (pinned) | Score/file | Findings/file |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| [vitejs/vite](https://github.com/vitejs/vite) | 4 | █▆▁▇ | `main@bc5c6a7` | **1.46** | **1.52** | **1.52** | +0.02 | 0.00 | 0.27 | 0.08 |
| [withastro/astro](https://github.com/withastro/astro) | 4 | █▂▁▁ | `main@7fe40bc` | **1.40** | **1.46** | **1.55** | 0.00 | -0.09 | 0.27 | 0.09 |
| [pmndrs/zustand](https://github.com/pmndrs/zustand) | 4 | ██▁▁ | `main@00f96a3` | **1.33** | **1.38** | **1.38** | 0.00 | -0.01 | 0.47 | 0.18 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | 4 | ▁▂▃█ | `main@5afcef5` | **1.29** | **1.34** | **1.34** | +0.02 | +0.02 | 0.24 | 0.08 |
| [umami-software/umami](https://github.com/umami-software/umami) | 4 | █▁▁▂ | `master@3a31ad3` | **1.00** | **1.04** | **1.04** | +0.00 | 0.00 | 0.18 | 0.07 |
| [egoist/tsup](https://github.com/egoist/tsup) | 4 | ▅▅▅▅ | `main@b906f86` | **0.89** | **0.92** | **0.92** | 0.00 | 0.00 | 0.21 | 0.08 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | 4 | ▅▅▅▅ | `main@f3a2e84` | **0.85** | **0.89** | **0.89** | 0.00 | 0.00 | 0.17 | 0.05 |
| [mikaelbr/node-notifier](https://github.com/mikaelbr/node-notifier) | 4 | ▅▅▅▅ | `master@b36c237` | **0.40** | **0.41** | **0.41** | 0.00 | 0.00 | 0.08 | 0.04 |
| [vercel/hyper](https://github.com/vercel/hyper) | 4 | ▅▅▅▅ | `canary@2a7bb18` | **0.40** | **0.41** | **0.41** | 0.00 | 0.00 | 0.65 | 0.16 |

## Table legend

- `Current blended` = latest repo score vs the current mature-OSS medians from the same rolling run.
- `Latest pinned` = latest repo score vs the frozen pinned mature-OSS baseline snapshot.
- `Highest pinned` = highest stored repo score on that same pinned baseline.
- `Δ prev (pinned)` = latest pinned - previous week's pinned score.
- `Δ first (pinned)` = latest pinned - first stored pinned score for that repo.

## Biggest increases vs previous week

- [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) — +0.51 vs previous week (pinned blended)
- [modem-dev/hunk](https://github.com/modem-dev/hunk) — +0.44 vs previous week (pinned blended)
- [vitejs/vite](https://github.com/vitejs/vite) — +0.02 vs previous week (pinned blended)
- [payloadcms/payload](https://github.com/payloadcms/payload) — +0.02 vs previous week (pinned blended)
- [robinebers/openusage](https://github.com/robinebers/openusage) — +0.01 vs previous week (pinned blended)

## Biggest decreases vs previous week

- [garrytan/gstack](https://github.com/garrytan/gstack) — -0.64 vs previous week (pinned blended)
- [openclaw/openclaw](https://github.com/openclaw/openclaw) — -0.23 vs previous week (pinned blended)
- [emdash-cms/emdash](https://github.com/emdash-cms/emdash) — -0.16 vs previous week (pinned blended)
- [cloudflare/vinext](https://github.com/cloudflare/vinext) — -0.06 vs previous week (pinned blended)
- [withastro/astro](https://github.com/withastro/astro) — 0.00 vs previous week (pinned blended)

## Notes

- `Trend (pinned)` is a mini sparkline of the repo's stored pinned-blended values across recent weekly points.
- Each repo stores one JSONL datapoint per UTC week; reruns in the same week replace that week's datapoint instead of appending duplicates.
- Older backfills can have fewer points for newer repos because the history job skips weeks before a repo had any commit on its current default branch.
- The existing pinned benchmark report remains the reproducible source of truth for exact SHA-based benchmark claims.
