---
title: Content design
kind: foundation
pages: [/foundations/content-design/overview, /foundations/content-design/alt-text, /foundations/content-design/global-writing/overview, /foundations/content-design/global-writing/word-choice, /foundations/content-design/notifications, /foundations/content-design/style-guide/ux-writing-best-practices, /foundations/content-design/style-guide/word-choice, /foundations/content-design/style-guide/grammar-and-punctuation]
tokenSets: []
expressive: false
fetched: 2026-11-13
---

## Summary

Content design is the wording and information structure of a UI. M3's guidance is written for
English UI text and follows AP style unless it says otherwise. The aim is text anyone can read
quickly, that translates well, and that tells people what will happen. This note covers voice and
mechanics, writing for translation, alt text, and notifications. How text behaves when enlarged or
truncated is in `writing.md`.

## Rules

### Voice

- Address the reader as "you" / "your" and write from their side of the screen.
- Do not mix "my" and "your" for the same person on one screen; pick "you" or drop the pronoun.
- Avoid "we" and "I" as the voice of the company: it reads as robotic or unsettling. Legal consent
  is the exception, where "I agree …" signals ownership of a decision.
- Describe consequences plainly. Say what an action will do and how to undo it. No alarming,
  scolding or manipulative warnings.

### Mechanics

- Sentence case everywhere: titles, headings, labels, buttons, menu items, navigation, app bars.
  Proper nouns and product names keep their capitals. Never ALL CAPS blocks.
- Make text scannable: specific headings and subheads that group and rank information.
- Leave the period off single sentences in short UI text (labels, tooltips, list items, dialog
  body, link text). Use periods when there are several sentences, or for a long sentence where it
  helps.
- Use contractions. "Do not" is allowed when you need the extra weight of a warning.
- Use the serial comma, except before "&". Commas go inside quotation marks.
- Numbers: commas from 1,000 upwards, but not in years, street addresses or radio frequencies.
  For millions, abbreviate to "M" and round when the reader only needs a sense of scale.
- No colon after a heading that introduces a list; use a colon for a list inside body text.
- Exclamation points only for real celebrations or greetings, not for empty states or routine
  tasks.
- Ellipses show an action in progress or text cut off (often added automatically). No space
  before them, and none in buttons or menu items that open a dialog or start a process.
- Parentheses define a term, acronym or source. Do not use them for asides; put needed
  information in the sentence.
- "&" only where space is tight (headlines, table or column headers, navigation labels, buttons);
  spell out "and" in sentences, before the last item of a list, and in email subject lines.
- Dashes: avoid em dashes; use an unspaced en dash for ranges (9 AM–Noon). Hyphens join compound
  adjectives and some noun phrases, never spaced. Phrasal verbs stay open ("check in to the room",
  but "the next check-in"). AP decides doubtful cases.
- Bold, not italics, for emphasis. Italics only for a single word or a title.
- Abbreviations sparingly; never Latin ones such as e.g. or etc. in UI text. Write "for example",
  "and more".

### Writing for translation (global writing)

Plain global English reads better for everyone and localizes cheaply.

- Prefer examples that work everywhere. When a local reference is unavoidable, explain it in the
  message description so the translator can substitute one. Flag place names, personal names,
  currencies, temperatures, date formats and service providers.
- Keep sentences short; split text with bullets and headings. Translations run on average about
  1.5 times the English length [site:/foundations/content-design/global-writing/word-choice], and
  languages such as German run longer still.
- Spell words out. Common time abbreviations are fine.
- Repeat the noun instead of "it"; strings are translated out of context and many languages give
  nouns gender. Begin a sentence with "this" or "that" only when the noun follows.
- No idioms or colloquialisms without explanation for the translator. No "please", "sorry" or
  "thank you", especially in errors; "please" is acceptable when asking for something
  inconvenient.
- Cut technical jargon; plain, even literal, wording survives translation.
- Words that are both noun and verb ("filter", "change", "traffic") or have two meanings ("home")
  need context, and should not be used both ways in one string.

### Alt text

- Alt text is off-screen text a screen reader speaks for an image; it also shows when the image
  fails to load.
- Decide if the image is decorative: if removing it loses no information, mark it decorative with
  an empty alt (`alt=""` in HTML) and write no alt text or caption.
- Describe meaning in context, not every visible detail. In a shop, describe the product, not the
  props around it.
- Keep it short. The alt text page recommends 140 characters
  [site:/foundations/content-design/alt-text]; some screen readers cut longer text.
- Never begin with "image of"; the reader already says "image".
- Read the adjacent text (body, caption, headline) first. Do not repeat the caption, and keep word
  choices consistent with it. The same image gets different alt text in different places.
- Captions should help sighted readers as well; a caption that supports the image makes alt text
  easier to write.
- Name the image type only when it matters (chart, map, diagram, screenshot, headshot).
- Charts:
  - Pattern: summary of the data type plus why the chart is shown. Give the takeaway, not a list of
    data points. Link to the underlying data when it exists.
  - Editorial charts: state the key takeaway and the numbers that prove it.
  - Analysis charts: describe the structure and point to the data instead of picking one
    conclusion, to avoid bias.
  - Prefer interactive charts (with tooltips per point) for complex data.
- Motion: an informative animation or GIF needs alt text that summarizes it, like a title would.
  Long videos use a video description instead.

### Notifications

- Write about the person, not the product. Every notification must be timely, specific,
  actionable and relevant, and easy to turn off. Never use them for unsolicited ads.
- Put the most important words first; people skim in an F pattern and endings get truncated.
- Make the next action clear with short, specific calls to action.
- Target the audience. Broad, generic messages lose value.
- Avoid dynamic text (names, campaign titles, time-of-day greetings) in titles: it breaks length
  limits after translation, and truncated titles do not expand. If unavoidable, pair it with at
  most one other word, put it in the body, and prepare a shorter backup.
- Use weekday names, not "today" or "tomorrow".
  About 20% of people see a notification on a later day [site:/foundations/content-design/notifications].
  Exception: notifications that auto-dismiss at a set time.
- Do not repeat the app name; the system already shows it.
- Do not fire onboarding notifications or emails while the person is still onboarding.
- Emoji: rarely, to enhance and never to replace words. Face and hand emoji work better than
  generic ones; never add negative-emotion emoji to bad news.
- Skip jokes. Useful beats cute.
- Offer opt-in and opt-out in context, and say what the person gains or loses.

## Measurements

Character limits (not dimensions; no tokens apply):

| Text | Limit |
|---|---|
| Notification title | under 29 characters [site:/foundations/content-design/notifications] |
| Notification body, collapsed | under 40 characters [site:/foundations/content-design/notifications] |
| Notification body, expanded | under 80 characters, extending the collapsed text [site:/foundations/content-design/notifications] |
| Notification buttons | 1 or 2, of 1 or 2 words each [site:/foundations/content-design/notifications] |
| SMS, Latin scripts | under 160 characters [site:/foundations/content-design/notifications] |
| SMS, non-Latin scripts | under 134 characters [site:/foundations/content-design/notifications] |
| Alt text | 140 characters recommended [site:/foundations/content-design/alt-text] |

- The writing best-practices page gives a different alt-text limit, 125 characters
  [site:/foundations/writing/best-practices]. Aim for the lower figure when in doubt.
- Newer Android versions allow longer notification text, but the limits still protect small
  screens.
- Tell translators about SMS limits in the message description; going over splits the message
  and costs more.

## Accessibility

- Sentence case and no caps blocks: the style guide treats all-caps text as inaccessible.
- Avoid abbreviations; screen readers may read them oddly.
- Alt text: meaningful images get it, decorative images get an empty alt, chart alt text gives the
  takeaway.
- Italics are hard to read; use bold for emphasis.
- Plain language and short sentences, written for translators, also lower the reading effort for
  everyone else.

## Platform mapping

- Writing rules are platform-neutral.
- Alt text on each platform:
  - Jetpack Compose (material3 1.5.0-rc01): `Icon(contentDescription = …)`; pass `null` only for
    decorative icons.
  - Flutter (`material_ui` 1.11.0): `IconButton.tooltip` gives the action a spoken label.
  - Web: `alt` on images and `alt=""` for decoration.
- Notification limits are Android notification guidance; the components here do not enforce them.

## Pitfalls

- Title Case or ALL CAPS labels.
- "We" speaking for the company, or "my" and "your" on one screen.
- Periods on single-line labels; ellipses on buttons that open dialogs.
- Idioms, "please" and "sorry" in error messages; ambiguous "it" and "this".
- Alt text that repeats the caption, lists every detail, starts with "image of", or is a file name.
- Notifications that start with the app name, use "tomorrow", or bury the action.
