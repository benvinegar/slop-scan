# Per-rule signal benchmark: Per-rule signal mini benchmark

Date: 2026-04-19
Analyzer version: 0.3.0
Manifest: `benchmarks/sets/rule-signal-mini.json`
Summary: `benchmarks/results/rule-signal-mini.json`
Report: `reports/rule-signal-mini.md`

## Goal

Run each built-in rule in isolation against a smaller pinned cohort of explicit-AI and mature-OSS repositories so we can compare which rules separate the cohorts most cleanly. The mature-OSS repos stay pinned to exact pre-2025 commit SHAs.

Signal score = average AUROC across the six normalized metrics when each rule runs in isolation against this pinned mini cohort. 1.00 means perfect AI-over-OSS separation, while 0.50 means no better than random ordering.

## Leaderboard

| Rank | Rule | Signal score | AI hit rate | OSS hit rate | Best metric | Best AUROC |
|---:|---|---:|---:|---:|---|---:|
| 1 | `defensive.error-swallowing` | **0.72** | 6/6 (100%) | 3/5 (60%) | findings / file | 0.87 |
| 2 | `defensive.empty-catch` | **0.67** | 6/6 (100%) | 5/5 (100%) | findings / file | 0.93 |
| 3 | `structure.pass-through-wrappers` | **0.67** | 5/6 (83%) | 4/5 (80%) | findings / file | 0.85 |
| 4 | `defensive.error-obscuring` | **0.66** | 5/6 (83%) | 5/5 (100%) | findings / file | 0.83 |
| 5 | `tests.duplicate-mock-setup` | **0.63** | 3/6 (50%) | 1/5 (20%) | findings / file | 0.70 |
| 6 | `comments.placeholder-comments` | **0.50** | 0/6 (0%) | 0/5 (0%) | findings / file | 0.50 |
| 7 | `defensive.async-noise` | **0.41** | 3/6 (50%) | 4/5 (80%) | findings / function | 0.50 |
| 8 | `structure.barrel-density` | **0.35** | 3/6 (50%) | 5/5 (100%) | findings / function | 0.50 |
| 9 | `structure.duplicate-function-signatures` | **0.32** | 2/6 (33%) | 4/5 (80%) | findings / file | 0.40 |
| 10 | `structure.directory-fanout-hotspot` | **0.22** | 6/6 (100%) | 5/5 (100%) | findings / file | 0.50 |
| 11 | `structure.over-fragmentation` | **0.17** | 1/6 (17%) | 4/5 (80%) | findings / file | 0.18 |


## defensive.error-swallowing

- Rank: **#1** of 11
- Signal score: **0.72 / 1.00**
- Family / severity / scope: `defensive` / `strong` / `file`
- Best metric: findings / file (0.87)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 6/6 (100%) | 3.00 | 9.10 | 0.07 | 0.53 | 0.24 |
| mature-oss | 3/5 (60%) | 6.00 | 13.80 | 0.01 | 0.17 | 0.09 |

### AUROC by normalized metric

- score / file: 0.87
- score / KLOC: 0.80
- score / function: 0.50
- findings / file: 0.87
- findings / KLOC: 0.77
- findings / function: 0.50

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 10 | 17.40 | 0.54 | 5.83 | 3.35 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 8 | 37.40 | 0.21 | 1.97 | 0.42 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 3 | 14.00 | 0.10 | 0.63 | 0.13 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 3 | 3.60 | 0.04 | 0.42 | 0.35 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 1 | 3.00 | 0.02 | 0.22 | 0.07 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 2 | 4.20 | 0.00 | 0.07 | 0.03 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 6 | 19.20 | 0.02 | 0.52 | 0.16 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 29 | 84.80 | 0.02 | 0.34 | 0.12 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 7 | 13.80 | 0.01 | 0.17 | 0.09 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |

## defensive.empty-catch

- Rank: **#2** of 11
- Signal score: **0.67 / 1.00**
- Family / severity / scope: `defensive` / `strong` / `file`
- Best metric: findings / file (0.93)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 6/6 (100%) | 10.00 | 42.30 | 0.12 | 1.23 | 0.31 |
| mature-oss | 5/5 (100%) | 13.00 | 45.10 | 0.04 | 1.21 | 0.35 |

### AUROC by normalized metric

- score / file: 0.87
- score / KLOC: 0.63
- score / function: 0.50
- findings / file: 0.93
- findings / KLOC: 0.57
- findings / function: 0.50

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 55 | 301.30 | 1.71 | 15.89 | 2.90 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 18 | 69.30 | 0.74 | 8.18 | 2.12 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 4 | 18.40 | 0.11 | 1.36 | 0.29 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 16 | 66.20 | 0.06 | 1.11 | 0.27 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 4 | 17.50 | 0.13 | 0.79 | 0.18 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 1 | 1.90 | 0.06 | 0.64 | 0.33 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 11 | 43.90 | 0.08 | 2.15 | 0.54 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 39 | 133.90 | 0.07 | 1.65 | 0.48 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 13 | 45.10 | 0.04 | 1.21 | 0.35 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 4 | 10.80 | 0.02 | 0.53 | 0.20 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 21 | 71.20 | 0.02 | 0.28 | 0.08 |

## structure.pass-through-wrappers

- Rank: **#3** of 11
- Signal score: **0.67 / 1.00**
- Family / severity / scope: `structure` / `strong` / `file`
- Best metric: findings / file (0.85)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 5/6 (83%) | 5.50 | 13.00 | 0.08 | 1.12 | 0.35 |
| mature-oss | 4/5 (80%) | 13.00 | 41.00 | 0.02 | 0.39 | 0.15 |

### AUROC by normalized metric

- score / file: 0.85
- score / KLOC: 0.65
- score / function: 0.50
- findings / file: 0.85
- findings / KLOC: 0.65
- findings / function: 0.50

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 1 | 5.00 | 0.16 | 1.67 | 0.33 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 29 | 85.00 | 0.08 | 1.43 | 0.49 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 6 | 19.00 | 0.11 | 1.40 | 0.44 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 7 | 16.00 | 0.09 | 0.84 | 0.37 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 5 | 10.00 | 0.07 | 0.45 | 0.22 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 25 | 65.00 | 0.05 | 1.74 | 0.67 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 24 | 62.00 | 0.03 | 0.77 | 0.30 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 3 | 8.00 | 0.02 | 0.39 | 0.15 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 13 | 41.00 | 0.01 | 0.16 | 0.05 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |

## defensive.error-obscuring

- Rank: **#4** of 11
- Signal score: **0.66 / 1.00**
- Family / severity / scope: `defensive` / `strong` / `file`
- Best metric: findings / file (0.83)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 5/6 (83%) | 4.50 | 9.40 | 0.06 | 0.82 | 0.38 |
| mature-oss | 5/5 (100%) | 5.00 | 14.40 | 0.02 | 0.39 | 0.13 |

### AUROC by normalized metric

- score / file: 0.80
- score / KLOC: 0.60
- score / function: 0.50
- findings / file: 0.83
- findings / KLOC: 0.70
- findings / function: 0.50

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 19 | 49.40 | 0.28 | 2.61 | 1.00 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 24 | 69.40 | 0.06 | 1.17 | 0.40 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 6 | 13.00 | 0.08 | 0.96 | 0.44 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 3 | 5.80 | 0.06 | 0.68 | 0.35 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 2 | 4.20 | 0.03 | 0.19 | 0.09 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 26 | 80.70 | 0.04 | 1.00 | 0.32 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 4 | 11.50 | 0.02 | 0.56 | 0.20 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 5 | 14.40 | 0.01 | 0.39 | 0.13 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 28 | 77.20 | 0.02 | 0.31 | 0.11 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 1 | 5.00 | 0.01 | 0.25 | 0.05 |

## tests.duplicate-mock-setup

- Rank: **#5** of 11
- Signal score: **0.63 / 1.00**
- Family / severity / scope: `tests` / `medium` / `file`
- Best metric: findings / file (0.70)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 3/6 (50%) | 1.50 | 4.50 | 0.04 | 0.53 | 0.15 |
| mature-oss | 1/5 (20%) | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |

### AUROC by normalized metric

- score / file: 0.70
- score / KLOC: 0.70
- score / function: 0.50
- findings / file: 0.70
- findings / KLOC: 0.70
- findings / function: 0.50

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 25 | 112.00 | 0.81 | 5.03 | 1.12 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 18 | 90.00 | 0.08 | 1.51 | 0.30 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 3 | 9.00 | 0.10 | 1.06 | 0.35 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 6 | 22.50 | 0.01 | 0.09 | 0.02 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |

## comments.placeholder-comments

- Rank: **#6** of 11
- Signal score: **0.50 / 1.00**
- Family / severity / scope: `comments` / `weak` / `file`
- Best metric: findings / file (0.50)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 0/6 (0%) | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| mature-oss | 0/5 (0%) | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |

### AUROC by normalized metric

- score / file: 0.50
- score / KLOC: 0.50
- score / function: 0.50
- findings / file: 0.50
- findings / KLOC: 0.50
- findings / function: 0.50

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |

## defensive.async-noise

- Rank: **#7** of 11
- Signal score: **0.41 / 1.00**
- Family / severity / scope: `defensive` / `medium` / `file`
- Best metric: findings / function (0.50)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 3/6 (50%) | 0.50 | 0.38 | 0.00 | 0.03 | 0.03 |
| mature-oss | 4/5 (80%) | 6.00 | 9.00 | 0.00 | 0.07 | 0.10 |

### AUROC by normalized metric

- score / file: 0.42
- score / KLOC: 0.35
- score / function: 0.50
- findings / file: 0.42
- findings / KLOC: 0.28
- findings / function: 0.50

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 2 | 4.50 | 0.03 | 0.24 | 0.11 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 4 | 6.00 | 0.01 | 0.10 | 0.07 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 1 | 0.75 | 0.00 | 0.06 | 0.07 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 8 | 11.25 | 0.01 | 0.30 | 0.21 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 11 | 18.00 | 0.01 | 0.22 | 0.14 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 2 | 1.50 | 0.00 | 0.07 | 0.10 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 6 | 9.00 | 0.00 | 0.04 | 0.02 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |

## structure.barrel-density

- Rank: **#8** of 11
- Signal score: **0.35 / 1.00**
- Family / severity / scope: `structure` / `medium` / `file`
- Best metric: findings / function (0.50)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 3/6 (50%) | 0.50 | 1.00 | 0.00 | 0.06 | 0.03 |
| mature-oss | 5/5 (100%) | 8.00 | 19.00 | 0.02 | 0.44 | 0.15 |

### AUROC by normalized metric

- score / file: 0.33
- score / KLOC: 0.20
- score / function: 0.50
- findings / file: 0.33
- findings / KLOC: 0.23
- findings / function: 0.50

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 1 | 3.00 | 0.09 | 1.00 | 0.33 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 1 | 2.00 | 0.02 | 0.24 | 0.12 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 3 | 7.00 | 0.01 | 0.12 | 0.05 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 27 | 68.50 | 0.04 | 0.85 | 0.33 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 8 | 19.00 | 0.02 | 0.51 | 0.21 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 3 | 9.00 | 0.02 | 0.44 | 0.15 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 33 | 83.00 | 0.02 | 0.33 | 0.13 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 1 | 3.00 | 0.01 | 0.15 | 0.05 |

## structure.duplicate-function-signatures

- Rank: **#9** of 11
- Signal score: **0.32 / 1.00**
- Family / severity / scope: `structure` / `medium` / `file`
- Best metric: findings / file (0.40)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 2/6 (33%) | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| mature-oss | 4/5 (80%) | 12.00 | 25.75 | 0.04 | 0.94 | 0.35 |

### AUROC by normalized metric

- score / file: 0.40
- score / KLOC: 0.30
- score / function: 0.27
- findings / file: 0.40
- findings / KLOC: 0.27
- findings / function: 0.30

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 50 | 143.25 | 0.13 | 2.41 | 0.84 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 5 | 11.25 | 0.08 | 0.51 | 0.22 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 12 | 25.75 | 0.05 | 1.26 | 0.59 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 131 | 309.00 | 0.07 | 1.23 | 0.52 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 28 | 76.00 | 0.04 | 0.94 | 0.35 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 6 | 7.50 | 0.01 | 0.37 | 0.29 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |

## structure.directory-fanout-hotspot

- Rank: **#10** of 11
- Signal score: **0.22 / 1.00**
- Family / severity / scope: `structure` / `medium` / `directory`
- Best metric: findings / file (0.50)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 6/6 (100%) | 1.50 | 6.10 | 0.05 | 0.54 | 0.17 |
| mature-oss | 5/5 (100%) | 21.00 | 76.98 | 0.04 | 1.13 | 0.31 |

### AUROC by normalized metric

- score / file: 0.47
- score / KLOC: 0.13
- score / function: 0.10
- findings / file: 0.50
- findings / KLOC: 0.10
- findings / function: 0.03

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 1 | 4.83 | 0.15 | 1.62 | 0.33 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 15 | 56.28 | 0.05 | 0.95 | 0.25 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 3 | 9.72 | 0.06 | 0.72 | 0.22 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 1 | 3.13 | 0.03 | 0.37 | 0.12 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 2 | 7.36 | 0.05 | 0.33 | 0.09 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 1 | 3.00 | 0.02 | 0.16 | 0.05 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 21 | 76.98 | 0.06 | 2.07 | 0.56 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 7 | 25.68 | 0.04 | 1.26 | 0.34 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 77 | 285.92 | 0.07 | 1.13 | 0.31 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 6 | 22.79 | 0.04 | 1.11 | 0.29 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 24 | 86.61 | 0.04 | 1.07 | 0.30 |

## structure.over-fragmentation

- Rank: **#11** of 11
- Signal score: **0.17 / 1.00**
- Family / severity / scope: `structure` / `strong` / `directory`
- Best metric: findings / file (0.18)

### Cohort summary

| Cohort | Hit rate | Median findings | Median repo score | Median score / file | Median score / KLOC | Median findings / KLOC |
|---|---:|---:|---:|---:|---:|---:|
| explicit-ai | 1/6 (17%) | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| mature-oss | 4/5 (80%) | 2.00 | 13.93 | 0.01 | 0.14 | 0.02 |

### AUROC by normalized metric

- score / file: 0.18
- score / KLOC: 0.18
- score / function: 0.15
- findings / file: 0.18
- findings / KLOC: 0.18
- findings / function: 0.15

### Repo results

| Repo | Cohort | Ref | Findings | Repo score | Score / file | Score / KLOC | Findings / KLOC |
|---|---|---|---:|---:|---:|---:|---:|
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | explicit-ai | `28980b0` | 3 | 20.12 | 0.02 | 0.34 | 0.05 |
| [garrytan/gstack](https://github.com/garrytan/gstack) | explicit-ai | `6cc094c` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | explicit-ai | `ea50862` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | explicit-ai | `b37663f` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | explicit-ai | `4de00d6` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | explicit-ai | `857f537` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| [vitejs/vite](https://github.com/vitejs/vite) | mature-oss | `a492253` | 8 | 54.02 | 0.04 | 1.45 | 0.21 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | mature-oss | `99d1741` | 2 | 13.93 | 0.02 | 0.68 | 0.10 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | mature-oss | `f3f36d8` | 5 | 34.86 | 0.01 | 0.14 | 0.02 |
| [withastro/astro](https://github.com/withastro/astro) | mature-oss | `f706899` | 1 | 6.50 | 0.00 | 0.08 | 0.01 |
| [umami-software/umami](https://github.com/umami-software/umami) | mature-oss | `227b255` | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
