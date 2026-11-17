# Discrimination test (protocol change PC-1: prepared, not run)

**Status.** Prepared on 2026-11-17 at the owner's request. It has **not been run**. It runs only after
the owner decides to run it, with `node evals/tools/discriminate.mjs --run-id <id> --owner-approved`.
The script refuses to start without that flag.

**Why.** In the pilot, the judge gave the skill-less web landing page 3 on 7 of 8 judged items. The
automated checks gave it 1, 1 and 1. Rubric v1 defines 3 as "indistinguishable from first-party
quality". This test asks that question directly: can a judge with no rubric tell real Google product
screens from generated ones?

**What changes, and what does not.**
- The rubric v1 and judge v1 stay frozen. Their hashes in `evals/frozen.json` do not change, and
  their scores are not changed by this test.
- This test is an extra measurement next to the rubric scores. It is reported separately.
- It uses the same isolated, read-only judge session as judge v1 (`runJudgeBatch` with this file's
  prompt and its own output check). It sees no rubric, no anchors and no requests.

## Procedure

1. **Inputs.**
   - All 17 owner references in `private/reference-screenshots/` (real).
   - Generated screenshots from one finished run, normally the baseline (`--run-id`).
2. **Matching.** References and generated images are grouped into buckets by form factor and
   theme. The form factors are:
   - phone: Android references, mobile-web references, 412×915 shots and the Flutter and Compose
     shots;
   - desktop: desktop-web references and 1440×900 shots.
   For each bucket, the script picks as many generated images as there are references, at random
   with a recorded seed, and at most one image per cell. A bucket with too few generated images is
   reported as a shortfall and is never filled from another bucket.
3. **Normalizing.** Every image is re-rendered in headless Chromium to a common width per form
   factor: 1080 px for phones and 1440 px for desktop, keeping the aspect ratio. This also drops all
   metadata. Each file is named `<id>.png` with a random 6-character id. The order is shuffled.
4. **Session.** There is one fresh isolated session for the whole set, so the judge compares images
   within the same set. The output is checked as described below. An invalid reply is re-run with a
   fresh session, at most twice.
5. **Un-blind.** `mapping.json` stays in `private/` and is opened only after a valid reply.

## Known tells this test cannot remove

The test removes resolution and metadata differences. It cannot remove the following, so every
verdict records the cue it was based on:
- **brand:** logos and product names;
- **content:** real user data, real file names, realistic amounts;
- **language:** the web references have a Turkish interface, while generated screens are English;
- **system-ui:** Android references show the status bar and the navigation bar, while generated
  shots show only the app;
- **edits:** three references have names and emails covered with their own background color.

The main result is accuracy on **design** cues only. A verdict based on brand, content, language or
system UI says nothing about design quality.

## Results reported

- Accuracy, recall on real images and recall on generated images.
- AUC of `pReal`: real images should get higher values than generated ones.
- Accuracy split by cue, with **design** first.
- For each generated image: its verdict, its cue, and its cell's judge v1 scores, read after
  un-blinding.

**Reading the results.** The decision rule belongs to the owner. My proposal is that judge v1 is
too lenient at the top of the scale if both of these hold:
- the judge spots generated images on design cues well above chance;
- the same images got 3 on most items under judge v1.
In that case, the options are a judge v2 or rubric v2 with a new calibration and freeze (protocol
change PC-2), or keeping v1 and reporting this test next to it.

## Prompt

````text
You are an expert in user interface design. The current folder holds screenshots of user
interfaces, named <id>.png. Some are screenshots of real Google products as they ship. The others
were generated for a test, by people or tools that are not Google. You are not told how many there
are of each.

For each ID below:
1. Look at the image. Read every file you need with the Read tool, and do not use any other tool.
2. Decide whether it is a real Google product screen ("real") or not ("generated").
3. Give pReal, your probability from 0 to 1 that it is real.
4. Give the single main cue your decision rests on, as one of these:
   - "design": layout, spacing, type, color, shape, components, polish;
   - "brand": logos or product names;
   - "content": the data shown, such as names, files or numbers;
   - "language": the language of the interface text;
   - "system-ui": phone status bar, navigation bar or browser parts;
   - "rendering": image artifacts, fonts that failed to load, scaling;
   - "other".
5. Write one sentence on what you saw.

IDs: {{IDS}}

Reply with only one JSON array, one object per ID, and nothing else:
[{"id": "<id>", "verdict": "real" | "generated", "pReal": <number 0..1>, "cue": "<cue>", "reason": "<one sentence>"}]
````
