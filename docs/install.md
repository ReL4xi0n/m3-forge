# Installing m3-forge

m3-forge is an unofficial skill for Material Design 3. It is not affiliated with or endorsed by
Google. It adds one command to Claude Code that builds Material 3 interfaces for the web, Flutter
and Jetpack Compose.

**Install it one way only.** Use the plugin or the manual copy, not both. With both, two commands
named `material3` exist and Claude Code may pick either; remove one before adding the other.

## Option 1: plugin marketplace

In Claude Code:

```
/plugin marketplace add ReL4xi0n/m3-forge
/plugin install m3-forge@m3-forge
```

The command is `/m3-forge:material3`.

A bare `/material3` may also work when no other command uses that name. Result of the check:
<!-- PENDING: install-path verification -->

### Update

```
/plugin marketplace update m3-forge
```

Then update or reinstall the plugin from the `/plugin` menu.

### Uninstall

```
/plugin uninstall m3-forge@m3-forge
/plugin marketplace remove m3-forge
```

## Option 2: manual copy

Copy the folder `plugin/skills/material3/` of this repository into your personal skills folder, so
that the file `SKILL.md` ends up at `<skills folder>/material3/SKILL.md`. The command is
`/material3`. Result of the check:
<!-- PENDING: install-path verification -->

| System | Personal skills folder |
|---|---|
| Windows | `%USERPROFILE%\.claude\skills\` |
| macOS | `~/.claude/skills/` |
| Linux | `~/.claude/skills/` |

If you use a custom configuration folder (the `CLAUDE_CONFIG_DIR` environment variable), the skills
folder is `skills/` inside it.

Example, from a clone of the repository:

```
# macOS, Linux
mkdir -p ~/.claude/skills && cp -R plugin/skills/material3 ~/.claude/skills/

# Windows (PowerShell)
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null
Copy-Item -Recurse plugin\skills\material3 "$env:USERPROFILE\.claude\skills\"
```

### Update

Delete `<skills folder>/material3/` and copy the new version in.

### Uninstall

Delete `<skills folder>/material3/`.

## Requirements

- Claude Code.
- Optional: Node.js 22 or newer. With it the skill generates exact color schemes, subsets icons,
  runs `verify` and takes screenshots. Without it the skill uses precomputed schemes and checks the
  code by reading it.
- Optional: the SDK of the platform you build for (Flutter SDK, JDK with the Android SDK, or Node
  with a Playwright browser for the web). Without it the code is still written; the screenshot step
  is skipped and the report says so.
- Optional: network access, only to fetch Rounded or Sharp icon styles. Offline, the skill uses the
  bundled Outlined icons and says so.

## Troubleshooting

- **`/material3` is not found.** After a plugin install the command is `/m3-forge:material3`. After
  a manual copy check that `material3/SKILL.md` sits directly inside the skills folder (not in a
  nested `material3/material3/`), and restart Claude Code.
- **Two commands with the same name.** You installed both ways. Uninstall one.
- **The skill does not start on its own.** It is a command: type `/material3` or
  `/m3-forge:material3` followed by your request. It never runs unless you call it.
- **Screenshots were skipped.** The report names the missing tool (Node, a Playwright browser, the
  Flutter SDK or the Android SDK). Install it and ask Claude to run the screenshot step again.
- **Marketplace add fails.** Check network access and that you can open
  `https://github.com/ReL4xi0n/m3-forge`.
