# Content

A screen with real-looking content is part of the design. Write the content before the layout and
make it specific to the request.

## Recipe

1. Invent the product. Give it a short original name and a one-line purpose that fits the request.
   Use that name in the app bar, page title and emails. Never borrow a real company's name or
   brand.
2. Invent its people. Use full names from several cultures and regions in one list (mix given
   names and family names from different languages), with matching initials for avatars. Vary
   name lengths so the layout is tested.
3. Invent plausible data for the domain: prices, quantities, ratings, dates, durations, statuses.
   Numbers are uneven and believable (not all round, not all the same length), totals add up, dates
   fall in a sensible range around today, and statuses are mixed (some done, some pending, one
   needing attention).
4. Format for the request's locale (default: the language the request is written in):
   - currency, decimals and thousands separators through the platform formatter: web
     `Intl.NumberFormat(locale, { style: 'currency', currency })`, Flutter
     `NumberFormat.currency(locale:)` from `intl`, Compose `NumberFormat.getCurrencyInstance(locale)`;
   - dates and times the same way (`Intl.DateTimeFormat`, `DateFormat`, `DateTimeFormatter`);
     weekday names instead of relative words for anything not shown live;
   - the currency the locale actually uses.
5. Contact details belong to the invented product: emails at its own domain (for example
   `<name>@<productname>.<tld>` with a plausible top-level domain), phone numbers in the local
   format.
6. Imagery: no image files or URLs. In place of a picture:
   - M3 Expressive on Compose and Flutter: a shape from the Material shape library (expressive.md,
     "Imagery and decoration"), filled with a container role (`primaryContainer`,
     `secondaryContainer`, `tertiaryContainer`) and, when it helps, a centered Material Symbols
     icon in the matching on role that names the subject (`landscape`, `restaurant`,
     `directions_car`). Use library shapes sparingly, for decoration and image crops only.
   - Web, and classic M3 everywhere: a container with a shape-scale corner (shape.md) filled the
     same way. The library shape geometry for the web is [NOT FOUND] in our sources; never draw an
     imitation.
   - Avatars: the person's initials in a full-shape (circular) container filled with a container
     role, text in its on role; the `person` icon when there is no name.
7. Destinations: the requested screen is complete. Every other visible destination (tab,
   navigation item, menu entry, link) opens a simple but credible screen with real content (a
   short list, a summary or a form with plausible data), never a blank or "coming soon" page.
8. Empty, loading and error states exist where the data could be empty or slow, written with the
   same care (what happened, what to do next, one action).

## Writing rules

- Sentence case for every title, button, tab, menu item and label. No ALL CAPS.
- Address the user as you. The product does not speak as we or I (legal consent excepted).
- Buttons say what happens, in one to three words, starting with a verb. No ellipsis on buttons
  that open a dialog.
- No period on single-sentence labels, tooltips or list items.
- Errors: what went wrong and how to fix it, plainly. No apology, no blame, no exclamation mark.
- Exclamation marks only for real celebrations.
- Bold for emphasis, never italics or underline (underline is for links).
- Short sentences, no idioms, no Latin abbreviations; text must survive translation (about half as
  long again in many languages).
- Alt text and labels describe meaning in context and never start with image of.

## Banned content

Never in UI, data, code or comments of the generated project:

- lorem ipsum or any filler Latin;
- example.com, example.org, example.net, or any made-up domain that is not the invented product's;
- Acme, John Doe, Jane Doe, Test User, foo, bar, baz, `Item 1` / `Item 2` style labels, `Title`,
  `Subtitle`, `Description here`, `Lorem`, `Sample text`;
- image URLs of any kind, including stock and placeholder hosts (Unsplash, Picsum, Pexels,
  placehold.co, placeholder.com, via.placeholder, dummyimage) and avatar generators;
- real brands from the brand list in `scripts/verify/brands.json`, and any other real company or product name;
- emoji used as icons or decoration (icons.md);
- destinations that only say coming soon, under construction or TODO.
