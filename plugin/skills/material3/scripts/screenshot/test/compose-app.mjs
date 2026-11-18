// A small Compose app for the screenshot step tests: the harness sample project (Gradle files only) with
// our own MainActivity. It has a search field, a long list (the first vertical scrollable), an empty
// text, a confirmation dialog, a 32 dp clickable (below the target size), a disabled 32 dp clickable and
// a low-contrast caption.
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SAMPLE = join(here, '..', '..', '..', '..', '..', '..', 'harness', 'compose', 'test', 'sample_app');

export const MAIN_ACTIVITY = `package dev.m3forge.sample

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val dark = isSystemInDarkTheme()
            MaterialTheme(colorScheme = if (dark) darkColorScheme() else lightColorScheme()) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var query by remember { mutableStateOf("") }
                    var confirm by remember { mutableStateOf(false) }
                    val plants = remember { (1..40).map { "Fern number $it" } }
                    val shown = plants.filter { it.contains(query, ignoreCase = true) }
                    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
                        Text(text = "Garden", style = MaterialTheme.typography.headlineSmall)
                        OutlinedTextField(
                            value = query,
                            onValueChange = { query = it },
                            label = { Text("Search plants") },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Button(onClick = { confirm = true }) { Text("Remove all") }
                        Text(text = "Faint caption", fontSize = 14.sp, color = if (dark) Color(0xFF3A3A3A) else Color(0xFFCFCFCF))
                        Box(
                            modifier = Modifier.size(32.dp).background(MaterialTheme.colorScheme.primary)
                                .semantics { contentDescription = "Small target" }.clickable { },
                        )
                        Box(
                            modifier = Modifier.size(32.dp).background(MaterialTheme.colorScheme.outlineVariant)
                                .semantics { contentDescription = "Disabled small target" }.clickable(enabled = false) { },
                        )
                        if (shown.isEmpty()) {
                            Text(text = "No plants match")
                        } else {
                            shown.forEach { Text(text = it, modifier = Modifier.padding(vertical = 12.dp)) }
                        }
                    }
                    if (confirm) {
                        AlertDialog(
                            onDismissRequest = { confirm = false },
                            title = { Text("Remove all plants?") },
                            text = { Text("This cannot be undone.") },
                            confirmButton = { TextButton(onClick = { confirm = false }) { Text("Remove") } },
                            dismissButton = { TextButton(onClick = { confirm = false }) { Text("Cancel") } },
                        )
                    }
                }
            }
        }
    }
}
`;

// A copy in a new temp folder whose name has a space (build outputs left out). -> project dir.
export function sampleApp() {
  const root = mkdtempSync(join(tmpdir(), 'm3 compose-'));
  const dir = join(root, 'garden app');
  cpSync(SAMPLE, dir, { recursive: true, filter: (s) => !['build', '.gradle', '.kotlin'].includes(basename(s)) });
  const main = join(dir, 'app', 'src', 'main', 'kotlin', 'dev', 'm3forge', 'sample');
  mkdirSync(main, { recursive: true });
  writeFileSync(join(main, 'MainActivity.kt'), MAIN_ACTIVITY);
  return dir;
}

export const STATES = {
  states: [
    { name: 'remove-dialog', steps: [{ click: { text: 'Remove all' } }] },
    { name: 'empty-search', steps: [{ enterText: { into: { hint: 'Search plants' }, text: 'cactus' } }] },
    { name: 'last-row', steps: [{ scrollTo: { text: 'Fern number 40' } }] },
    { name: 'broken', steps: [{ click: { text: 'No such button' } }] },
  ],
};
