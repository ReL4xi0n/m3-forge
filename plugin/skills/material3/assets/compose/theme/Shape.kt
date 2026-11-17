// material3 skill asset: assets/compose/theme/Shape.kt
// Material 3 shape scale (Compose).
// Built from the skill token files (tokens/sys.json); generated, do not edit.
// Placeholder package: install-assets rewrites it to the project's theme package.
package m3.theme

import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.unit.dp

/** The Material 3 shape scale, Expressive steps (largeIncreased, extraLargeIncreased, extraExtraLarge) included. */
object M3Shapes {
    val none = RectangleShape // md.sys.shape.corner.none
    val extraSmall = RoundedCornerShape(4.dp) // md.sys.shape.corner.extra-small
    val small = RoundedCornerShape(8.dp) // md.sys.shape.corner.small
    val medium = RoundedCornerShape(12.dp) // md.sys.shape.corner.medium
    val large = RoundedCornerShape(16.dp) // md.sys.shape.corner.large
    val largeIncreased = RoundedCornerShape(20.dp) // md.sys.shape.corner.large-increased
    val extraLarge = RoundedCornerShape(28.dp) // md.sys.shape.corner.extra-large
    val extraLargeIncreased = RoundedCornerShape(32.dp) // md.sys.shape.corner.extra-large-increased
    val extraExtraLarge = RoundedCornerShape(48.dp) // md.sys.shape.corner.extra-extra-large
    val full = CircleShape // md.sys.shape.corner.full
}

/** The material3 Shapes of the scale. Pass it to MaterialTheme(shapes = M3ShapeScheme). */
val M3ShapeScheme: Shapes = Shapes(
    extraSmall = M3Shapes.extraSmall,
    small = M3Shapes.small,
    medium = M3Shapes.medium,
    large = M3Shapes.large,
    extraLarge = M3Shapes.extraLarge,
)
