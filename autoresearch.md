# Autoresearch: new strong AI-signal rule on the full pinned benchmark

## Objective

Find a **new** `slop-scan` rule that is not just a restatement of an existing built-in rule and that scores **> 0.80 signal_score** on the full pinned `known-ai-vs-solid-oss` benchmark set.

The rule should generalize as a real slop/code-quality smell, not as benchmark-specific trivia. We may use the full pinned benchmark set to evaluate candidate rules, but we must not hardcode repo ids, repo-specific strings, manifest membership, or benchmark-only exceptions.

## Metrics

- **Primary**: `signal_score` (unitless, higher is better) — average AUROC across the rule-signal normalized metrics on the full pinned benchmark set.
- **Secondary**:
  - `best_metric_auc`
  - `ai_hit_rate`
  - `oss_hit_rate`

## How to Run

`./autoresearch.sh`

That script runs `scripts/benchmark-experimental-rule.ts` against the full pinned benchmark cohort and writes:

- `benchmarks/results/autoresearch-candidate-rule.json`
- `reports/autoresearch-candidate-rule.md`

## Files in Scope

- `src/rules/promise-default-fallbacks/index.ts` — current experimental candidate rule.
- `scripts/benchmark-experimental-rule.ts` — isolated benchmark runner for the candidate rule on the full pinned set.
- `tests/promise-default-fallbacks.test.ts` — focused behavioral coverage for the candidate rule.
- `src/facts/ts-helpers.ts` — only if the rule needs shared AST helpers.
- `src/benchmarks/rule-signal.ts` — only if benchmark summary math or isolated-rule wiring truly needs adjustment.
- `autoresearch.md`
- `autoresearch.sh`
- `autoresearch.checks.sh`
- `autoresearch.ideas.md`

## Off Limits

- `benchmarks/sets/known-ai-vs-solid-oss.json` repo membership, refs, provenance, or pairings.
- `benchmarks/.cache/**` pinned checkout contents.
- Hardcoding repo names, paths, benchmark fixture strings, or cohort-specific allow/deny lists into the rule.
- Editing existing built-in rules just to make the candidate look more unique.

## Constraints

- Do not cheat on the benchmark.
- Do not knowingly overfit to a single repo or a single weird generated subtree.
- Prefer explainable AST/code-smell rules over raw string matching.
- Keep the candidate distinct from existing rules such as `error-swallowing`, `error-obscuring`, `empty-catch`, `pass-through-wrappers`, and `placeholder-comments`.
- If the candidate changes analyzer behavior materially, keep focused tests passing.
- Generated benchmark artifacts are allowed for inspection, but benchmark manifests and pinned refs must stay fixed.

## What's Been Tried

- Initial corpus mining across the full pinned benchmark suggested that **promise `.catch()` handlers returning sentinel defaults** (`null`, `undefined`, `false`, `0`, `""`, `[]`, `{}`) are a promising signal. The first regex-based proxy over the full set showed roughly **0.89–0.91 AUROC** across the normalized metrics, but that proxy turned out to blur together true default returns and empty `() => {}` handlers.
- First honest AST baseline: `defensive.promise-default-fallbacks` scored **0.663** on the full set. It cleanly catches explicit default returns and log+default handlers, but it misses several high-signal empty promise-catch handlers in AI repos such as DevWorkbench, openusage, and agent-ci.
- The isolated benchmark harness also needed a function-count fix: isolated registries were computing `file.functionSummaries`, but the engine was dropping that fact before summary time. `scripts/benchmark-experimental-rule.ts` now has to recover function counts through `analyzeRepository` hooks so `scorePerFunction` and `findingsPerFunction` stay honest.
- Textual comment mining surfaced fallback-comment phrases (for example `fall through to` / `fall back to`) and formulaic doc-comment prefixes, but those look easier to overfit and are currently lower priority than the promise-catch idea.
