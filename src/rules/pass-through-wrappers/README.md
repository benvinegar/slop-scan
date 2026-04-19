# structure.pass-through-wrappers

Flags trivial wrappers that mostly just rename or forward another call.

- **Family:** `structure`
- **Severity:** `strong`
- **Scope:** `file`
- **Requires:** `file.functionSummaries`, `file.comments`

## How it works

The rule looks for functions whose body is essentially a direct pass-through call.
It skips two common intentional cases:

- nearby alias / compatibility comments such as `alias` or `backward compatibility`
- boundary wrappers around targets like `fetch`, `axios.*`, `prisma.*`, `redis.*`, and similar APIs

## Flagged example

```ts
export function getUser(id: string) {
  return loadUser(id);
}

export function saveUser(input: UserInput) {
  return persistUser(input);
}
```

## Usually ignored

```ts
// backward compatibility alias
export function fetchUserRecord(id: string) {
  return getUser(id);
}

export function getJson(url: string) {
  return fetch(url);
}
```

## Scoring

Each wrapper adds `2` points, capped at `5` for the file.

## Benchmark signal

Small pinned rule benchmark ([manifest](../../../benchmarks/sets/rule-signal-mini.json)):

- Signal rank: **#3 of 11**
- Signal score: **0.67 / 1.00**
- Best separating metric: **findings / file (0.85)**
- Hit rate: **5/6 AI repos** vs **4/5 mature OSS repos**
- Full results: [rule signal report](../../../reports/rule-signal-mini.md#structurepass-through-wrappers)
