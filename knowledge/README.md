# knowledge/

The distilled knowledge base that the `/material3` skill's references are written from. It is a
build-side resource: the skill never reads this folder at runtime.

Parts of `guidance/` are paraphrased and changed from the Material Design 3 guidance at
https://m3.material.io/ by Google, used under the Creative Commons Attribution 4.0 International
license (https://creativecommons.org/licenses/by/4.0/). The notes are rewritten in our own words,
condensed and reorganized, and combined with token values taken from the source repositories. Each
note lists the pages it was written from. See `NOTICE` and `docs/sources-and-licensing.md`.

## Layout

| Path | What | Made by |
|---|---|---|
| `coverage.md`, `coverage.json` | Which site pages were scraped (paths and statuses only) | `tools/extract/scrape/run.mjs coverage` |
| `coverage-exceptions.json` | Why a page is missing, one reason per page | by hand, reviewed |
| `sources.lock.json` | The pinned token sources (commit or version plus hash) | `tools/extract/sources/fetch.mjs --resolve` |
| `tokens/<source>.json` | Every token record from one source, with file and line | `tools/extract/tokens/report.mjs` |
| `tokens/merged.json` | One entry per token: canonical value, per-platform values, provenance | same |
| `tokens/summary.json` | Counts | same |
| `tokens/color-system.json` | Color variants, roles and spec versions from material-color-utilities | same |
| `conflicts.md` | Values that disagree (repo vs repo, site vs repo) | same |
| `not-found.md` | Tokens a platform's own source does not define; unparsed and unmapped names | same |
| `site-values.json` | Every number the notes take from the site | `tools/extract/knowledge/lint.mjs` |
| `guidance/` | The notes, in our own words | by hand |

Do not edit generated files. CI fails when they are stale.

## Rules for numbers

- Numbers are never guessed, rounded or converted. A value no source gives is written `[NOT FOUND]`.
- Every number with a unit (`dp`, `px`, `sp`, `ms`, `%`) and every hex color in a note carries a marker
  on the same line:
  - `[token:<id>]`: the value comes from a token. The linter checks that the number equals one of the
    token's values (any platform; references are followed; `38%` equals `0.38`).
  - `[site:<path>]`: the value is printed on a scraped site page, as text or as a label in a spec
    image. Pixel measuring is never used. If a token covers the same property, the line also carries
    `[token:<id>]`; when the two differ, the difference goes to `conflicts.md` and the repository
    value wins.
  - `[NOT FOUND]`.
- In M3 tokens `px` and `dp` are the same unit. Flutter's data gives numbers without units; they are
  compared by magnitude.

## Precedence

1. A platform uses the value from its own repository: material-web for the web, `material_ui` for
   Flutter, Compose material3 for Jetpack Compose.
2. The cross-platform canonical value is material-web's.
3. When the site and a repository disagree, the repository wins.

Every disagreement is listed in `conflicts.md`.

## Note template

Front matter:

```yaml
---
title: Buttons
kind: component        # style | foundation | component | expressive
pages: [/components/buttons/overview, /components/buttons/specs]
tokenSets: [button.filled, button.small]
expressive: true
fetched: 2026-11-13    # date of the scrape run the note was written from
---
```

Sections (each required; write "Not covered by the sources." rather than leaving one empty):

- component: Summary, Use it when, Anatomy, Variants, Expressive, States and behavior, Measurements,
  Accessibility, Platform mapping, Pitfalls
- style, foundation, expressive: Summary, Rules, Measurements, Accessibility, Platform mapping,
  Pitfalls

Notes are written from understanding, not copied: read the private page text, close it, then write.
The guard rejects any commit that shares a 12-word run with the scraped text.
