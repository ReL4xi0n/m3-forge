// material3 skill asset: assets/compose/theme/below-1.5/Theme.kt
// M3Theme for material3 below 1.5: MaterialTheme with the color scheme, shapes and type scale.
// Missing below 1.5: MaterialExpressiveTheme, MotionScheme (and its expressive() scheme),
// MaterialShapes, LoadingIndicator, ButtonGroup and the other Expressive APIs; the motion tokens in
// Motion.kt (M3Motion) still apply to your own animations.
// Placeholder package: install-assets rewrites it to the project's theme package.
package m3.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable

/** The app theme: color scheme from Color.kt (scripts/color), type scale and shapes. */
@Composable
fun M3Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) M3DarkColorScheme else M3LightColorScheme,
        shapes = M3ShapeScheme,
        typography = M3Typography,
        content = content,
    )
}
