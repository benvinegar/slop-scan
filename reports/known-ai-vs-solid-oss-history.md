# Rolling benchmark history: Known AI repos vs older solid OSS repos

Latest update: 2026-05-04
History dir: `benchmarks/history/known-ai-vs-solid-oss/`
Pinned baseline snapshot: `benchmarks/results/known-ai-vs-solid-oss.json` (2026-04-26)
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

- `0.4.0` @ `0e8d699` — 18 latest repo snapshots

## Latest cohort medians

| Cohort | Repo count | Median current blended | Median score/file | Median findings/file |
|---|---:|---:|---:|---:|
| explicit-ai | 9 | **5.37** | 1.26 | 0.30 |
| mature-oss | 9 | **1.00** | 0.15 | 0.05 |

## AI cohort latest standings

| Repo | Points | Trend (pinned) | Latest ref | Current blended | Latest pinned | Highest pinned | Δ prev (pinned) | Δ first (pinned) | Score/file | Findings/file |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| [garrytan/gstack](https://github.com/garrytan/gstack) | 7 | ▃▂▂▁▇▇█ | `main@30fe6bb` | **9.73** | **11.86** | **11.86** | +0.66 | +5.49 | 1.90 | 0.49 |
| [FullAgent/fulling](https://github.com/FullAgent/fulling) | 7 | ▁▁▁▁███ | `main@d95060f` | **8.40** | **10.24** | **10.24** | 0.00 | +8.08 | 1.28 | 0.29 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | 7 | ▂▁▁▂███ | `main@be45efd` | **7.89** | **9.62** | **9.62** | +0.37 | +5.72 | 1.40 | 0.40 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | 7 | ▁▁▁▁███ | `main@ea50862` | **7.37** | **8.99** | **8.99** | 0.00 | +5.59 | 1.26 | 0.47 |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | 7 | ▁▁▁▁███ | `main@a90be47` | **5.37** | **6.55** | **6.55** | +0.15 | +3.61 | 1.07 | 0.30 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | 7 | ▁▁▁▁███ | `main@f5a9159` | **5.20** | **6.35** | **6.41** | -0.07 | +3.29 | 1.32 | 0.31 |
| [emdash-cms/emdash](https://github.com/emdash-cms/emdash) | 5 | ▁▁███ | `main@a945a88` | **4.06** | **4.96** | **5.08** | -0.13 | +2.78 | 0.82 | 0.21 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | 7 | ▁▁▁▁███ | `main@fb342f5` | **3.05** | **3.72** | **3.81** | -0.08 | +1.73 | 0.43 | 0.13 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | 7 | ▁▂▂▃███ | `main@b516dc8` | **2.94** | **3.59** | **3.59** | 0.00 | +2.79 | 0.48 | 0.17 |

## Mature OSS cohort latest standings

| Repo | Points | Trend (pinned) | Latest ref | Current blended | Latest pinned | Highest pinned | Δ prev (pinned) | Δ first (pinned) | Score/file | Findings/file |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|---:|
| [withastro/astro](https://github.com/withastro/astro) | 7 | ▂▁▁▁█▇█ | `main@7711e47` | **1.72** | **2.10** | **2.10** | +0.05 | +0.55 | 0.17 | 0.06 |
| [vitejs/vite](https://github.com/vitejs/vite) | 7 | ▁▁▁▁███ | `main@7c3a61f` | **1.71** | **2.08** | **2.08** | 0.00 | +0.56 | 0.15 | 0.05 |
| [egoist/tsup](https://github.com/egoist/tsup) | 7 | ▁▁▁▁███ | `main@b906f86` | **1.24** | **1.52** | **1.52** | 0.00 | +0.60 | 0.15 | 0.06 |
| [pmndrs/zustand](https://github.com/pmndrs/zustand) | 7 | ██▆▆▁▁▁ | `main@1b04af1` | **1.11** | **1.36** | **1.38** | 0.00 | -0.03 | 0.19 | 0.08 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | 7 | ▇▇▇█▁▁▁ | `main@cd37bd4` | **1.00** | **1.22** | **1.34** | +0.00 | -0.10 | 0.10 | 0.03 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | 7 | ▁▁▁▁███ | `main@f3a2e84` | **0.81** | **0.99** | **0.99** | 0.00 | +0.11 | 0.09 | 0.02 |
| [mikaelbr/node-notifier](https://github.com/mikaelbr/node-notifier) | 7 | ▁▁▁▁███ | `master@b36c237` | **0.77** | **0.95** | **0.95** | 0.00 | +0.53 | 0.08 | 0.04 |
| [vercel/hyper](https://github.com/vercel/hyper) | 7 | ▁▁▁▁███ | `canary@2a7bb18` | **0.74** | **0.90** | **0.90** | 0.00 | +0.49 | 0.63 | 0.15 |
| [umami-software/umami](https://github.com/umami-software/umami) | 7 | ████▁▁▁ | `master@62c214d` | **0.70** | **0.85** | **1.04** | 0.00 | -0.19 | 0.07 | 0.02 |

## Table legend

- `Current blended` = latest repo score vs the current mature-OSS medians from the same rolling run.
- `Latest pinned` = latest repo score vs the frozen pinned mature-OSS baseline snapshot.
- `Highest pinned` = highest stored repo score on that same pinned baseline.
- `Δ prev (pinned)` = latest pinned - previous week's pinned score.
- `Δ first (pinned)` = latest pinned - first stored pinned score for that repo.

## Biggest increases vs previous week

- [garrytan/gstack](https://github.com/garrytan/gstack) — +0.66 vs previous week (pinned blended)
- [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) — +0.37 vs previous week (pinned blended)
- [openclaw/openclaw](https://github.com/openclaw/openclaw) — +0.15 vs previous week (pinned blended)
- [withastro/astro](https://github.com/withastro/astro) — +0.05 vs previous week (pinned blended)
- [payloadcms/payload](https://github.com/payloadcms/payload) — +0.00 vs previous week (pinned blended)

## Biggest decreases vs previous week

- [emdash-cms/emdash](https://github.com/emdash-cms/emdash) — -0.13 vs previous week (pinned blended)
- [cloudflare/vinext](https://github.com/cloudflare/vinext) — -0.08 vs previous week (pinned blended)
- [robinebers/openusage](https://github.com/robinebers/openusage) — -0.07 vs previous week (pinned blended)
- [modem-dev/hunk](https://github.com/modem-dev/hunk) — 0.00 vs previous week (pinned blended)

## Notes

- `Trend (pinned)` is a mini sparkline of the repo's stored pinned-blended values across recent weekly points.
- Each repo stores one JSONL datapoint per UTC week; reruns in the same week replace that week's datapoint instead of appending duplicates.
- Older backfills can have fewer points for newer repos because the history job skips weeks before a repo had any commit on its current default branch.
- The existing pinned benchmark report remains the reproducible source of truth for exact SHA-based benchmark claims.
