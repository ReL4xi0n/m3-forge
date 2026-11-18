// material3 skill asset: assets/compose/theme/Theme.kt
// M3Theme for material3 1.5 and later: MaterialExpressiveTheme with the expressive motion scheme.
// For material3 below 1.5 install the part theme-below-1.5 (MaterialTheme, no motion scheme).
// Placeholder package: install-assets rewrites it to the project's theme package.
package m3.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialExpressiveTheme
import androidx.compose.material3.MotionScheme
import androidx.compose.runtime.Composable

/**
 * The app theme: color scheme from Color.kt (scripts/color), type scale, shapes and the expressive
 * motion scheme. Wrap the content of every screen (and every preview) in it.
 */
// MaterialExpressiveTheme and MotionScheme.expressive() are marked experimental in material3 1.5.
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun M3Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialExpressiveTheme(
        colorScheme = if (darkTheme) M3DarkColorScheme else M3LightColorScheme,
        motionScheme = MotionScheme.expressive(),
        shapes = M3ShapeScheme,
        typography = M3Typography,
        content = content,
    )
}
