# defensive.async-noise

Flags async ceremony that adds little value.

- **Family:** `defensive`
- **Severity:** `medium`
- **Scope:** `file`
- **Requires:** `file.functionSummaries`

## How it works

The rule reports two patterns:

- redundant `return await` around a direct call
- trivial async pass-through wrappers with no internal `await`

Boundary wrappers are exempted for common edge-facing targets such as `fetch`, `axios.*`, `prisma.*`, `redis.*`, and similar APIs, because those wrappers are often intentional integration boundaries.

## Flagged examples

```ts
async function loadUser(id: string) {
  return await fetchUser(id);
}

async function getUser(id: string) {
  return fetchUser(id);
}
```

## Usually ignored

```ts
async function loadUser(id: string) {
  const user = await fetchUser(id);
  return normalizeUser(user);
}

async function getJson(url: string) {
  return fetch(url);
}
```

## Scoring

Redundant `return await` sites add `1.5` each.
Plain async pass-through wrappers add `0.75` each.
The total file contribution is capped at `4`.

## Benchmark signal

Small pinned rule benchmark ([manifest](../../../benchmarks/sets/rule-signal-mini.json)):

- Signal rank: **#7 of 11**
- Signal score: **0.41 / 1.00**
- Best separating metric: **findings / function (0.50)**
- Hit rate: **3/6 AI repos** vs **4/5 mature OSS repos**
- Full results: [rule signal report](../../../reports/rule-signal-mini.md#defensiveasync-noise)
