# Compose icons (Material Symbols)

Compose icons are the official Material Symbols Android vector drawables, copied unchanged:
`res/drawable/m3s_<name>.xml` (FILL 0) and `m3s_<name>_fill1.xml` (FILL 1, for selected and active
states). Default instance only: weight 400, grade 0, size 24 (vectors have no other axes; if the request
asks for other axes, say that Compose cannot follow). Never `Icons.*` (material-icons: verify flags
`icon-source`), other icon packages, emoji, or hand-drawn paths. Path data is never retyped by the model.

`S` is the skill folder (`${CLAUDE_SKILL_DIR}`). The source is `S/assets/icons/symbols-outlined-24.tsv.gz`
(every Outlined icon, gzipped TSV).

## Generate the drawables

```
node "S/scripts/icons/index.mjs" <project> --platform compose --names settings,home,arrow_back
```

- Names are checked against `S/assets/fonts/MaterialSymbolsOutlined.codepoints`; an unknown name exits 4
  with the three closest names. Offline: Outlined never uses the network.
- Writes both files per icon into `<module>/src/main/res/drawable/` (`app/` when it exists, else the root).
  A second run adds icons. Exit 3: a file with that name exists and is not an official Symbols vector;
  the script never overwrites it.
- `--style rounded` or `--style sharp` (only when the user asks): the script downloads each used icon's
  official XML at the pinned commit (`versions.json`, `symbols.commit`) and accepts it only when every
  path hashes into `scripts/verify/symbols-paths.json`. Else it uses bundled Outlined (output `style` is
  `outlined`, `notice` is set) and the report says: "Rounded icons requested but could not be downloaded
  (offline?); used bundled Outlined. Re-run with network access to switch." (Sharp likewise; "failed
  verification" replaces the parenthesis when a path does not hash).

## The tint attribute

The official files tint with `?attr/colorControlNormal`, which appcompat and Material Components define.
A project with neither fails resource linking ("attribute colorControlNormal not found"): add
`<attr name="colorControlNormal" format="color" />` inside `<resources>` of `res/values/attrs.xml` (the
template ships it). `Icon()` tints from `LocalContentColor` either way.

## Use

```kotlin
Icon(painterResource(R.drawable.m3s_settings), contentDescription = null)             // decorative
Icon(painterResource(R.drawable.m3s_favorite_fill1), contentDescription = "Saved")    // selected state
```

The drawable tints from `LocalContentColor`. Give `contentDescription` whenever the icon alone carries
the meaning; an icon button needs a label (`contentDescription` of its icon). Use the `_fill1` file for the
selected item of a navigation bar, a toggle or a chip.

## No Node

Pull the line of each icon from the TSV and write the XML with one command per file. Fields of a line,
separated by TAB: name, FILL 0 paths, FILL 1 paths (`=` when identical), optional flags (`m` = auto
mirrored, `v` = viewport 24). Check the name first: no TSV line means no icon, pick another name.
Replace `NAME` and `FILL` (0 or 1); `OUT` is `<module>/src/main/res/drawable/m3s_NAME.xml`
(`m3s_NAME_fill1.xml` for FILL 1). Output is byte-identical to the Node script's.

sh (Linux, macOS, Git Bash):

```sh
gzip -dc "S/assets/icons/symbols-outlined-24.tsv.gz" | awk -F'\t' -v n=NAME -v f=FILL -v w=24 -v q='"' '$1==n{p=$2;if(f==1&&$3!="=")p=$3;vp=($4~/v/)?24:960;print "<vector xmlns:android=" q "http://schemas.android.com/apk/res/android" q;print "    android:width=" q w "dp" q;print "    android:height=" q w "dp" q;print "    android:viewportWidth=" q vp q;print "    android:viewportHeight=" q vp q;print "    android:tint=" q "?attr/colorControlNormal" q ($4~/m/?"":">");if($4~/m/)print "    android:autoMirrored=" q "true" q ">";k=split(p,a,"|");for(i=1;i<=k;i++){print "  <path";print "      android:fillColor=" q "@android:color/white" q;print "      android:pathData=" q a[i] q "/>"};print "</vector>"}' > "OUT"
```

PowerShell (Windows PowerShell 5.1 or 7):

```powershell
$n='NAME';$f=FILL;$w=24;$out='OUT';$g='S\assets\icons\symbols-outlined-24.tsv.gz';$r=New-Object IO.StreamReader((New-Object IO.Compression.GZipStream([IO.File]::OpenRead($g),[IO.Compression.CompressionMode]::Decompress)));while($null -ne($l=$r.ReadLine())){if($l.StartsWith("$n`t")){$c=$l.Split("`t");break}};$r.Close();$p=$c[1];if($f -eq 1 -and $c[2] -ne '='){$p=$c[2]};$fl=if($c.Count -gt 3){$c[3]}else{''};$vp=if($fl -match 'v'){24}else{960};$q='"';$o=@("<vector xmlns:android=${q}http://schemas.android.com/apk/res/android$q","    android:width=$q${w}dp$q","    android:height=$q${w}dp$q","    android:viewportWidth=$q$vp$q","    android:viewportHeight=$q$vp$q","    android:tint=${q}?attr/colorControlNormal$q$(if($fl -match 'm'){''}else{'>'})");if($fl -match 'm'){$o+="    android:autoMirrored=${q}true$q>"};foreach($d in $p.Split('|')){$o+='  <path';$o+="      android:fillColor=${q}@android:color/white$q";$o+="      android:pathData=$q$d$q/>"};$o+='</vector>';[IO.File]::WriteAllText($out,($o -join "`n")+"`n",(New-Object Text.UTF8Encoding $false))
```

With `$out` a full path (create the `drawable` folder first). Rounded and Sharp have no no-Node route: use
bundled Outlined and say so with the notice above.
