package m3.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.LoadingIndicator
import androidx.compose.material3.MaterialShapes
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.toShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import m3.app.theme.M3Space
import m3.app.theme.M3Theme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            M3Theme {
                TrailScreen()
            }
        }
    }
}

private data class Trail(val name: String, val detail: String)

private val trails = listOf(
    Trail("Ridge loop", "6.4 km, 2 h 10 min, easy"),
    Trail("Quarry steps", "3.1 km, 1 h 05 min, moderate"),
    Trail("Salt marsh boardwalk", "4.8 km, 1 h 30 min, easy"),
)

// MaterialShapes and LoadingIndicator are experimental in material3 1.5.
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
private fun TrailScreen() {
    Scaffold { padding ->
        Surface(modifier = Modifier.fillMaxSize().padding(padding)) {
            Column(
                modifier = Modifier.padding(M3Space.space300),
                verticalArrangement = Arrangement.spacedBy(M3Space.space200),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(M3Space.space200)) {
                    Box(
                        modifier = Modifier
                            .size(M3Space.space700)
                            .clip(MaterialShapes.Cookie9Sided.toShape()),
                        contentAlignment = Alignment.Center,
                    ) {
                        LoadingIndicator()
                    }
                    Text(text = "Weekend trails", style = MaterialTheme.typography.headlineMedium)
                }
                trails.forEach { trail ->
                    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(M3Space.space200), verticalArrangement = Arrangement.spacedBy(M3Space.space100)) {
                            Text(text = trail.name, style = MaterialTheme.typography.titleMedium)
                            Text(text = trail.detail, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
                FilledTonalButton(onClick = { }) {
                    Text("Log a hike")
                }
            }
        }
    }
}
