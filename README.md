# m3-forge — an unofficial skill for Material Design 3

`/material3` is a Claude Code skill that builds Material Design 3 interfaces, M3 Expressive by
default, for the web, Flutter and Jetpack Compose.

> **Disclaimer.** Not affiliated with or endorsed by Google. Material Design is a design system by
> Google.
>
> Not to be confused with hamen/material-3-skill; this is a separate project.

**Status:** under construction; not yet released.

## Install (planned)

The commands below will work once the skill is released.

### As a Claude Code plugin

```
/plugin marketplace add ReL4xi0n/m3-forge
/plugin install m3-forge@m3-forge
```

Command: `/m3-forge:material3`. A bare `/material3` is expected to work as well, as long as no
other command already uses that name. This will be verified before release.

### As a personal skill

Copy `plugin/skills/material3/` to `~/.claude/skills/material3/`. The command is then `/material3`.

Use only one of the two installs.

## Contributing

```
npm test                                # unit tests
git config core.hooksPath .githooks     # maintainers: enable the pre-commit and pre-push guards
```

- Nothing under `private/` is ever committed.
- The guards must never be bypassed (`--no-verify` is forbidden). A reviewed false positive goes
  into `tools/guard/allowlist.txt` with a reason.
- The hooks need the maintainers' private term list and fail closed without it. Other
  contributors can leave them off. CI repeats the checks; the term list is a repository secret,
  so it applies to branches in this repository and to every push to `main`.
- Commits must use a GitHub noreply email as author and committer; CI rejects any other address.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
