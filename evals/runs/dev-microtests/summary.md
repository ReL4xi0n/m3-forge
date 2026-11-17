# Wording micro-tests (dev-microtests-2026-11-17)

30 runs, total cost $18.63. Hit = verify violation of the row's checks (static). Verdicts were read by hand.

| Row | Checks | Arm | Runs | Runs with hit | Total hits | Cost (USD) | Not ok |
|---|---|---|---|---|---|---|---|
| F7 | icon-source + unknown-icon | skill | 5 | 0 | 0 | 4.61 | 0 |
| F7 | icon-source + unknown-icon | control | 5 | 5 | 9 | 0.64 | 0 |
| F11 | placeholder-content | skill | 5 | 0 | 0 | 6.67 | 0 |
| F11 | placeholder-content | control | 5 | 0 | 0 | 0.48 | 0 |
| F12 | brand | skill | 5 | 0 | 0 | 5.71 | 0 |
| F12 | brand | control | 5 | 0 | 0 | 0.53 | 0 |

## Hit lines

### F7 / skill

No hits.

### F7 / control

| Run | Check | Location | Line | Verdict |
|---|---|---|---|---|
| micro.F7.control.r1 | icon-source | index.html:121 | `<svg class="icon-on" viewBox="0 0 24 24" fill="none" stroke="currentColor"` | real |
| micro.F7.control.r1 | icon-source | index.html:127 | `<svg class="icon-off" viewBox="0 0 24 24" fill="none" stroke="currentColor"` | real |
| micro.F7.control.r2 | icon-source | notifications-setting.html:131 | `<svg class="bell-on" viewBox="0 0 24 24" fill="none" stroke="currentColor"` | real |
| micro.F7.control.r2 | icon-source | notifications-setting.html:137 | `<svg class="bell-off" viewBox="0 0 24 24" fill="none" stroke="currentColor"` | real |
| micro.F7.control.r3 | icon-source | notifications-row.html:154 | `<svg class="bell-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` | real |
| micro.F7.control.r3 | icon-source | notifications-row.html:159 | `<svg class="bell-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` | real |
| micro.F7.control.r4 | icon-source | index.html:134 | `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"` | real |
| micro.F7.control.r5 | icon-source | settings-row.html:126 | `<svg class="bell-on" viewBox="0 0 24 24" fill="none" stroke="currentColor"` | real |
| micro.F7.control.r5 | icon-source | settings-row.html:132 | `<svg class="bell-off" viewBox="0 0 24 24" fill="none" stroke="currentColor"` | real |

### F11 / skill

No hits.

### F11 / control

No hits.

### F12 / skill

No hits.

### F12 / control

No hits.

## Verdict totals

| Row | Arm | real | false | unread |
|---|---|---|---|---|
| F7 | skill | 0 | 0 | 0 |
| F7 | control | 9 | 0 | 0 |
| F11 | skill | 0 | 0 | 0 |
| F11 | control | 0 | 0 | 0 |
| F12 | skill | 0 | 0 | 0 |
| F12 | control | 0 | 0 | 0 |

## Notes (read by hand)

- F7 control: all 9 hits are real hand-drawn inline `<svg>` bell icons (stroke paths in the page). The skill arm used `material-symbols-outlined` ligature spans in all 5 runs (0 hits).
- F11: no placeholder-content hit in either arm. The row does not discriminate with this task wording.
- F12: no brand hit in either arm, but all 5 control pages contain the text labels "Visa" and "Mastercard" (found by grep, not flagged). The brand check covers asset file names, not text labels, so a real brand use is not counted here. The skill arm had no such labels.
- Cost: skill arm $17.0 (about $0.8 to $1.5 a run, 2 to 4 min), control arm about $1.65.
