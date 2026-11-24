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
6. Imagery: no image files or URLs. A picture becomes a container filled with a container role
   (`secondaryContainer` or a surface container, one role per collection; never tertiary) holding, when it helps, a
   centered Material Symbols icon in the matching on role that names the subject (`landscape`,
   `restaurant`). Avatars hold the person's initials (the `person` icon without a name). Shape: M3
   Expressive uses a library shape (composition.md, "Library shapes"; all three platforms),
   classic M3 a shape-scale corner (avatars full).
7. Empty, loading and error states exist where the data could be empty or slow, written with the
   same care (what happened, what to do next, one action).

## Writing rules

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
