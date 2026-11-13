# Sources and licensing

Terms report for Phase 1 of m3-forge. It must be approved before any of our code requests
m3.material.io pages or its sitemap.

Researched on 2026-11-13. Everything below is a summary in our own words. Short quoted fragments
are marked as quotes. This report is not legal advice.

## 1. Summary and verdict

**Verdict: proceed, with one condition** (see §9, question 1).

- robots.txt allows every path we need. It sets no crawl delay.
- The content-license statement could not yet be read verbatim, because the page that carries it
  renders only with JavaScript. We therefore add a check: the scraper reads that page first and
  stops if the expected license statement is not there.
- Google's Terms of Service tie their ban on automated access to a site's machine-readable
  instructions such as robots.txt. We follow robots.txt and run slowly.
- Every token source is under a permissive license (Apache-2.0, or BSD-3-Clause for Flutter's
  `material_ui`).
- No blocker found.

## 2. robots.txt

- **Fetched:** `https://m3.material.io/robots.txt` on 2026-11-13T06:16Z.
- **SHA-256:** `f2277178e0afd0938b7ba3610d8005d2c14101c1615684f23db96f9da08ccdc1`.
- **Groups:** one group, for every user agent (`*`). It has no `Allow` lines and no `Crawl-delay`.
- **Disallowed patterns:**
  - `/archive`;
  - `/search.html`;
  - any URL whose query string contains `q=`, pattern `/*?*q=`. Because of the wildcard this also
    matches parameters that end in `q`, such as `faq=`;
  - any URL whose query string contains `utm_source=`, pattern `/*?*utm_source=`.
- **Sitemap:** `https://m3.material.io/sitemap.xml`.
- **Consequences for us:**
  - The guidance sections (`/styles/`, `/foundations/`, `/components/`) are allowed.
  - Our scraper requests paths without query strings.
  - It also blocks any in-page request that matches a disallowed pattern.
  - Before scraping, it re-fetches robots.txt and stops if the hash differs from the one recorded
    when the page list was planned.

## 3. Content license of m3.material.io

- A web search on 2026-11-13 points to `https://m3.material.io/get-started`. That page reportedly
  says that Material 3 content, guidelines, imagery and resources are available under either
  Apache 2.0 or CC BY 4.0.
- We could not read the sentence verbatim:
  - the page is a JavaScript single-page app, and a plain fetch returns only its title;
  - `/terms`, `/license` and `/about` return HTTP 404.
- We have not yet confirmed which works the statement covers, or any exceptions such as logos or
  trademarks.
- **How we use it:**
  - We rely on the CC BY 4.0 option for paraphrased guidance (§8).
  - We do not rely on the imagery part at all: images never enter the public repo (§7).
  - The scraper's first page is `/get-started` (see §9, question 1).

## 4. Google Terms of Service and automated access

Source: `https://policies.google.com/terms`, effective 2026-07-30, read on 2026-11-13.

- **Automated access.** Among the listed abuses is using automated means to access content against
  a site's machine-readable instructions; robots.txt is the example given.
  - Our scraper obeys robots.txt (§2), fetches one page at a time, and waits at least 3 seconds
    between pages.
- **Harm and disruption.** Users must not disrupt or overload Google's services, and Google may
  suspend access over conduct such as scraping content that does not belong to the user.
  - We rely on the content license (§3) and on low, polite traffic.
  - The scraper blocks images, media, fonts and analytics. It runs only when a maintainer starts it
    and never in CI.
- **Branding and notices.** Google's branding, logos and legal notices must not be removed or
  altered.
  - We copy no logos.
  - Notices that come with a source stay with it (§6).
- **AI training clause.** The terms forbid using AI-generated content from Google services to build
  machine-learning models.
  - This does not apply: we train no models, and the site's guidance is not AI-generated output.
  - An AI assistant reads our private copy to write notes. That is reading and paraphrasing, not
    model training.
- **Separately licensed content.** The terms do not address Creative Commons content shown on a
  Google site. We take the site's own license statement (§3) as the governing grant for its content.

## 5. Trademarks and naming

Sources: Google's trademark usage guidelines (reached from `about.google/brand-resource-center/rules/`)
and the Google trademark list (`about.google/brand-resource-center/trademark-list/`), both read on
2026-11-13.

- The trademark list says it is illustrative and non-exhaustive. It has no entry for Material
  Design, Material You, Material 3 or Material Symbols. Absence from that list does not mean Google
  has no rights in these names, so we treat them as Google's marks.
- The guidelines say:
  - do not build Google brand features into your own product, service or company names;
  - do not imply affiliation with Google, or sponsorship or endorsement by Google;
  - do not make a Google mark the most prominent element of your content;
  - use only approved artwork when you show a Google logo.
- **What we do:**
  - The project is named `m3-forge` and never uses "Google" in a name. The owner accepted the low
    risk of "m3" on 2026-11-12.
  - "Material Design 3" appears only descriptively: "an unofficial skill for Material Design 3".
  - The README states that the project is not affiliated with or endorsed by Google.
  - We use no Google or Material logos and no site imagery.

## 6. Sources and their licenses

Checked on 2026-11-13 from each repository's license file, package metadata or POM.

| Source | License | What we take | Where it lands |
|---|---|---|---|
| m3.material.io guidance | CC BY 4.0 (or Apache 2.0), per §3 | Text and the site's own JSON, for private study; paraphrased notes | Raw: `private/` only. Notes: `knowledge/guidance/` |
| material-web (`material-components/material-web`) | Apache-2.0 | Token values from `tokens/versions/latest` | `knowledge/tokens/` |
| material-color-utilities (npm `@material/material-color-utilities` 0.4.0) | Apache-2.0 | Variant and color-role names, default-variant evidence (Phase 1); bundled code (Phase 3) | `knowledge/tokens/color-system.json`; later the skill's scripts |
| material-components-android | Apache-2.0 | Token values (cross-check only) | `knowledge/tokens/` |
| Flutter `material_ui` (pub, publisher flutter.dev, 1.11.0; source in `flutter/packages`) | BSD-3-Clause | Token values and spring constants | `knowledge/tokens/` |
| androidx Compose material3 1.5.0-rc01 (Maven sources jar) | Apache-2.0 | Token values, including expressive springs | `knowledge/tokens/` |
| google/material-design-icons | Apache-2.0 | Material Symbols Outlined font and codepoints (Phase 3) | Skill assets |
| googlefonts/roboto-flex, googlefonts/roboto-classic | OFL-1.1 | Font files (Phase 3) | Skill assets |

Notes:
- Token values and API names are facts we record, not copied expression. Each value carries its
  source file and line, so it can be audited.
- If Phase 3 copies any `material_ui` source code, the BSD-3-Clause copyright notice and license
  text go with it.
- Fonts keep their `OFL.txt` and the icons keep their Apache license file, as spec §3 requires.

## 7. Our compliance choices

- **Pace:** one page at a time; at least 3 s between page navigations. The site sets no crawl
  delay; if it adds one and it is longer than 3 s, we use it. On HTTP 429 or 503 we back off,
  waiting at least 30 s, doubling each retry, for at most 3 attempts.
- **Scope:** only sitemap pages under `/styles/`, `/foundations/` and `/components/`, pages about
  M3 Expressive, and `/get-started` (for the license check). Every tab of each component is
  scraped as its own page.
- **Interaction:**
  - Inside the page's main content, the scraper opens closed disclosure sections, selects in-page
    tabs and presses "expand" buttons, so that hidden text is captured.
  - It never follows links, fills forms or submits anything.
- **Blocked requests:** images, media and fonts, which are never downloaded; analytics hosts
  (Google Analytics, Tag Manager, DoubleClick); and any same-site request that robots.txt
  disallows.
- **What is saved:** rendered text, the site's own JSON responses, image URLs and alt text, and
  run metadata, including every third-party host contacted.
- **User agent:**
  - Playwright's default Chromium user agent, followed by exactly
    ` m3-forge (+https://github.com/ReL4xi0n/m3-forge)` (owner decision).
  - The same string is used to fetch robots.txt and the sitemap.
  - No personal data, no login, no cookies kept between runs.
- **Storage:**
  - Raw output goes only to the private repository, cloned in the gitignored `private/`, under
    `raw/<date>/`.
  - Measurement screenshots go only to `private/reference-screenshots/<date>/`.
  - The public repo never names the private repository.
- **Public repo:**
  - No site images or illustrations.
  - No raw site text: the guard blocks any 12-word run shared with the raw corpus in every commit.
  - No byte-identical copy of any private file: guard rule `private-copy`.
- **When:** only when a maintainer starts it locally, never in CI or on a schedule.

## 8. Attribution

- `NOTICE` lists the source repositories and their licenses, and it carries the guidance
  attribution below.
- Each knowledge note lists the site pages it was written from, in its `pages` front matter. That
  gives the link to the source material that CC BY 4.0 asks for.
- **Guidance attribution (CC BY 4.0):** parts of `knowledge/guidance/` and the skill's references
  are paraphrased and changed from the Material Design 3 guidance at https://m3.material.io/ by
  Google, used under the Creative Commons Attribution 4.0 International license
  (https://creativecommons.org/licenses/by/4.0/).
  - Changes: rewritten in our own words, condensed, reorganized, and combined with token values
    extracted from source repositories.
  - Google does not endorse this project.

## 9. Open questions for the owner

1. **License check before the scrape.** Should the scraper first render `/get-started`, using the
   same politeness rules?
   - It would save that page's text privately and check that it contains the CC BY 4.0
     statement, then stop and report the exact wording to you before scraping anything else.
   - Alternatively, you can look at the page in your own browser and confirm the wording yourself.
2. **Imagery.** The reported statement also covers imagery. We still keep every site image out of
   the public repo, as the spec decided. Should this stay as it is? (Recommended: yes.)
