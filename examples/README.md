# Examples

This folder will hold a small set of finished outputs of the `/material3` skill: the code the skill
wrote and the screenshots it took, for each supported platform.

It is empty on purpose for now. Examples are added only after the final measurements of the skill
are done, and only outputs of the released skill, chosen by the maintainer. Nothing here comes from
the evaluation prompts, and baseline (no-skill) outputs and reference images are never added.

## Planned layout

```
examples/
  web/<name>/
    <the project's UI source files>
    screenshots/        light and dark, mobile and desktop
  flutter/<name>/
    <the project's UI source files>
    screenshots/        light and dark
  compose/<name>/
    <the project's UI source files>
    screenshots/        light and dark
```

Each example folder is a snapshot of what the skill produced, not a runnable repository: it holds
the generated UI code and the theme files, without build output or dependency folders.

## Checks

CI runs the skill's `verify` script on every example folder (the folder's platform is its parent
folder name). While this folder has no examples, that step is skipped. Every example must pass
`verify` with no errors, and the repository guard must pass on it.
