# Per-rule signal benchmark: Known AI repos vs older solid OSS repos

Date: 2026-04-19
Analyzer version: 0.3.0
Manifest: `benchmarks/sets/known-ai-vs-solid-oss.json`
Summary: `benchmarks/results/autoresearch-candidate-rule.json`
Report: `reports/autoresearch-candidate-rule.md`

## Goal

Compare a cohort of known AI-generated JavaScript/TypeScript repos against well-regarded OSS repos, with the mature-OSS cohort pinned to the latest default-branch commit on or before 2025-01-01, using exact commit SHAs and normalized analyzer metrics.

Signal score = average AUROC across the six normalized metrics when each rule runs in isolation against this pinned mini cohort. 1.00 means perfect AI-over-OSS separation, while 0.50 means no better than random ordering.

## Leaderboard

| Rank | Rule | Signal score | AI hit rate | OSS hit rate | Best metric | Best AUROC |
|---:|---|---:|---:|---:|---|---:|
| 1 | `defensive.promise-default-fallbacks` | **0.97** | 9/9 (100%) | 5/9 (56%) | score / function | 0.99 |


## defensive.promise-default-fallbacks

- Rank: **#1** of 1
- Signal score: **0.97 / 1.00**
- Family / severity / scope: `defensive` / `strong` / `file`
- Best metric: score / function (0.99)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 9/9 (100%) | 3.00 | 10.00 | 0.11 | 1.18 | 0.32 |
| mature-oss | 5/9 (56%) | 1.00 | 2.00 | 0.00 | 0.02 | 0.01 |

### AUROC by normalized metric

- score / file: 0.95
- score / KLOC: 0.98
- score / function: 0.99
- findings / file: 0.96
- findings / KLOC: 0.95
- findings / function: 0.98

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 1 | 8.00 | 0.25 | 2.68 | 0.33 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 7 | 40.00 | 0.23 | 2.11 | 0.37 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 30 | 87.00 | 0.08 | 1.46 | 0.50 |
| [emdash-cms/emdash](https://github.com/emdash-cms/emdash) | explicit-ai | `dbaf8c6` | 39 | 144.00 | 0.13 | 1.20 | 0.32 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 3 | 10.00 | 0.11 | 1.18 | 0.35 |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | explicit-ai | `44cf747` | 335 | 1140.00 | 0.11 | 1.11 | 0.32 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 3 | 10.00 | 0.06 | 0.74 | 0.22 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 1 | 4.00 | 0.03 | 0.18 | 0.04 |
| [FullAgent/fulling](https://github.com/FullAgent/fulling) | explicit-ai | `d95060f` | 1 | 2.00 | 0.01 | 0.16 | 0.08 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 9 | 20.50 | 0.01 | 0.25 | 0.11 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 3 | 6.00 | 0.00 | 0.16 | 0.08 |
| [vercel/hyper](https://github.com/vercel/hyper) | mature-oss | `2a7bb18` | 1 | 8.00 | 0.07 | 0.12 | 0.02 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 1 | 2.00 | 0.00 | 0.10 | 0.05 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 3 | 6.00 | 0.00 | 0.02 | 0.01 |
| [egoist/tsup](https://github.com/egoist/tsup) | mature-oss | `cd03e1e` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [mikaelbr/node-notifier](https://github.com/mikaelbr/node-notifier) | mature-oss | `b36c237` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [pmndrs/zustand](https://github.com/pmndrs/zustand) | mature-oss | `2e6d881` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
