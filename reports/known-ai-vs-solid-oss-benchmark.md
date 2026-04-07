# Pinned benchmark: Known AI repos vs older solid OSS repos

Date: 2026-04-07
Analyzer version: 0.1.0
Config mode: default

## Goal

Compare a cohort of known AI-generated JavaScript/TypeScript repos against older, well-regarded OSS repos using pinned commit SHAs and normalized analyzer metrics.

## Reproduction

```bash
bun run benchmark:fetch
bun run benchmark:scan
bun run benchmark:report
```

Manifest: `benchmarks/sets/known-ai-vs-solid-oss.json`
Snapshot: `benchmarks/results/known-ai-vs-solid-oss.json`
Report: `reports/known-ai-vs-solid-oss-benchmark.md`

The pinned refs below are the exact commits used for the saved snapshot.

Blended score = geometric mean of the six normalized-metric ratios versus the mature OSS cohort medians, then rescaled so the mature OSS cohort median is 1.00. Higher means a repo is consistently noisier across the benchmark dimensions.

## AI cohort

| Repo | Ref | Age | Stars | Blended | Files | Logical LOC | Functions | Score/file | Score/KLOC | Score/function | Findings/file | Findings/KLOC | Findings/function |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| [garrytan/gstack](https://github.com/garrytan/gstack) | `6cc094c` | 0.1y | 65613 | **6.68** | 176 | 18958 | 832 | 2.12 | 19.67 | 0.45 | 0.45 | 4.17 | 0.09 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | `ea50862` | 0.8y | 17 | **4.81** | 32 | 2986 | 147 | 1.00 | 10.76 | 0.22 | 0.44 | 4.69 | 0.10 |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | `44cf747` | 0.4y | 350232 | **4.15** | 10580 | 1037965 | 40714 | 1.01 | 10.31 | 0.26 | 0.30 | 3.02 | 0.08 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | `857f537` | 0.2y | 1715 | **4.10** | 139 | 22270 | 491 | 1.27 | 7.95 | 0.36 | 0.30 | 1.89 | 0.09 |
| [FullAgent/fulling](https://github.com/FullAgent/fulling) | `d95060f` | 0.5y | 2413 | **2.96** | 219 | 12154 | 574 | 0.52 | 9.41 | 0.20 | 0.16 | 2.80 | 0.06 |
| [emdash-cms/emdash](https://github.com/emdash-cms/emdash) | `dbaf8c6` | 0.0y | 7842 | **2.45** | 1072 | 120432 | 3513 | 0.59 | 5.22 | 0.18 | 0.18 | 1.56 | 0.05 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | `28980b0` | 0.1y | 7709 | **2.04** | 1129 | 59523 | 2917 | 0.37 | 7.03 | 0.14 | 0.10 | 1.88 | 0.04 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | `b37663f` | 0.1y | 352 | **1.60** | 166 | 13564 | 752 | 0.38 | 4.71 | 0.08 | 0.11 | 1.40 | 0.03 |

## Mature OSS cohort

| Repo | Ref | Age | Stars | Blended | Files | Logical LOC | Functions | Score/file | Score/KLOC | Score/function | Findings/file | Findings/KLOC | Findings/function |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| [vitejs/vite](https://github.com/vitejs/vite) | `bdc53ab` | 6.0y | 79637 | **2.07** | 1433 | 46593 | 2300 | 0.26 | 7.98 | 0.16 | 0.08 | 2.36 | 0.05 |
| [withastro/astro](https://github.com/withastro/astro) | `2c9bf5e` | 5.1y | 58212 | **1.80** | 2812 | 131236 | 4359 | 0.24 | 5.04 | 0.15 | 0.08 | 1.71 | 0.05 |
| [egoist/tsup](https://github.com/egoist/tsup) | `b906f86` | 6.1y | 11198 | **1.31** | 48 | 2813 | 140 | 0.21 | 3.61 | 0.07 | 0.08 | 1.42 | 0.03 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | `f3a2e84` | 10.3y | 7481 | **1.07** | 581 | 20432 | 1008 | 0.16 | 4.48 | 0.09 | 0.04 | 1.08 | 0.02 |
| [antfu-collective/ni](https://github.com/antfu-collective/ni) | `6d96905` | 5.4y | 8146 | **0.93** | 87 | 2138 | 99 | 0.11 | 4.68 | 0.10 | 0.02 | 0.94 | 0.02 |
| [umami-software/umami](https://github.com/umami-software/umami) | `0a83864` | 5.7y | 36012 | **0.92** | 674 | 24859 | 1209 | 0.12 | 3.26 | 0.07 | 0.04 | 1.05 | 0.02 |
| [mikaelbr/node-notifier](https://github.com/mikaelbr/node-notifier) | `b36c237` | 13.3y | 5843 | **0.59** | 24 | 2114 | 42 | 0.08 | 0.90 | 0.05 | 0.04 | 0.47 | 0.02 |
| [vercel/hyper](https://github.com/vercel/hyper) | `2a7bb18` | 9.8y | 44687 | **0.55** | 115 | 65160 | 5356 | 0.60 | 1.05 | 0.01 | 0.15 | 0.26 | 0.00 |

## Cohort medians

| Metric | AI median | Solid median | Ratio |
|---|---:|---:|---:|
| Blended score | **3.53** | **1.00** | **3.53x** |
| Score / file | **0.80** | **0.18** | **4.31x** |
| Score / KLOC | **8.68** | **4.04** | **2.15x** |
| Score / function | **0.21** | **0.08** | **2.56x** |
| Findings / file | **0.24** | **0.06** | **3.98x** |
| Findings / KLOC | **2.34** | **1.06** | **2.21x** |
| Findings / function | **0.07** | **0.02** | **2.99x** |

## Spot-check pairings

| AI repo | Solid repo | Score/file ratio | Score/KLOC ratio | Score/function ratio | Findings/file ratio | Findings/KLOC ratio | Findings/function ratio |
|---|---|---:|---:|---:|---:|---:|---:|
| `devworkbench` | `hyper` | 1.69x | 10.25x | 17.11x | 2.96x | 17.97x | 30.01x |
| `openusage` | `umami` | 10.59x | 2.44x | 5.38x | 7.83x | 1.80x | 3.98x |
| `vinext` | `vite` | 1.43x | 0.88x | 0.89x | 1.29x | 0.80x | 0.80x |

## Top rule families by cohort

### AI cohort
- `tests.duplicate-mock-setup` — 1075 (29.7%)
- `defensive.needless-try-catch` — 918 (25.3%)
- `structure.pass-through-wrappers` — 703 (19.4%)
- `structure.barrel-density` — 457 (12.6%)
- `defensive.async-noise` — 330 (9.1%)
- `structure.directory-fanout-hotspot` — 112 (3.1%)

### Mature OSS cohort
- `defensive.needless-try-catch` — 148 (36.5%)
- `structure.pass-through-wrappers` — 93 (22.9%)
- `structure.directory-fanout-hotspot` — 68 (16.7%)
- `structure.barrel-density` — 47 (11.6%)
- `defensive.async-noise` — 32 (7.9%)
- `structure.over-fragmentation` — 12 (3.0%)

## Notes

- This benchmark is intentionally pinned to exact commit SHAs so future reruns can reproduce the same cohort.
- AI provenance in the set may come from README disclosures or user-provided provenance recorded in the manifest.
- The benchmark scanner uses the analyzer's default config for every repo to keep results comparable.
- The analyzer still only scans JS/TS-family files, so non-JS/TS portions of mixed-language repos are out of scope.
