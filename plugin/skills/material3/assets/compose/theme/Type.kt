// material3 skill asset: assets/compose/theme/Type.kt
// Material 3 type scale and emphasized type scale (Compose).
// Built from the skill token files (tokens/sys.json); generated, do not edit.
// Placeholder package: install-assets rewrites it to the project's theme package.
package m3.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/** The Material 3 type scale. Pass it to MaterialTheme(typography = M3Typography). */
val M3Typography: Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.display-large.font, md.ref.typeface.brand
        fontWeight = FontWeight.Normal, // md.sys.typescale.display-large.weight, md.ref.typeface.weight-regular
        fontSize = 57.sp, // md.sys.typescale.display-large.size
        lineHeight = 64.sp, // md.sys.typescale.display-large.line-height
        letterSpacing = (-0.2).sp, // md.sys.typescale.display-large.tracking
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.display-medium.font, md.ref.typeface.brand
        fontWeight = FontWeight.Normal, // md.sys.typescale.display-medium.weight, md.ref.typeface.weight-regular
        fontSize = 45.sp, // md.sys.typescale.display-medium.size
        lineHeight = 52.sp, // md.sys.typescale.display-medium.line-height
        letterSpacing = 0.sp, // md.sys.typescale.display-medium.tracking
    ),
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.display-small.font, md.ref.typeface.brand
        fontWeight = FontWeight.Normal, // md.sys.typescale.display-small.weight, md.ref.typeface.weight-regular
        fontSize = 36.sp, // md.sys.typescale.display-small.size
        lineHeight = 44.sp, // md.sys.typescale.display-small.line-height
        letterSpacing = 0.sp, // md.sys.typescale.display-small.tracking
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.headline-large.font, md.ref.typeface.brand
        fontWeight = FontWeight.Normal, // md.sys.typescale.headline-large.weight, md.ref.typeface.weight-regular
        fontSize = 32.sp, // md.sys.typescale.headline-large.size
        lineHeight = 40.sp, // md.sys.typescale.headline-large.line-height
        letterSpacing = 0.sp, // md.sys.typescale.headline-large.tracking
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.headline-medium.font, md.ref.typeface.brand
        fontWeight = FontWeight.Normal, // md.sys.typescale.headline-medium.weight, md.ref.typeface.weight-regular
        fontSize = 28.sp, // md.sys.typescale.headline-medium.size
        lineHeight = 36.sp, // md.sys.typescale.headline-medium.line-height
        letterSpacing = 0.sp, // md.sys.typescale.headline-medium.tracking
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.headline-small.font, md.ref.typeface.brand
        fontWeight = FontWeight.Normal, // md.sys.typescale.headline-small.weight, md.ref.typeface.weight-regular
        fontSize = 24.sp, // md.sys.typescale.headline-small.size
        lineHeight = 32.sp, // md.sys.typescale.headline-small.line-height
        letterSpacing = 0.sp, // md.sys.typescale.headline-small.tracking
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.title-large.font, md.ref.typeface.brand
        fontWeight = FontWeight.Normal, // md.sys.typescale.title-large.weight, md.ref.typeface.weight-regular
        fontSize = 22.sp, // md.sys.typescale.title-large.size
        lineHeight = 28.sp, // md.sys.typescale.title-large.line-height
        letterSpacing = 0.sp, // md.sys.typescale.title-large.tracking
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.title-medium.font, md.ref.typeface.plain
        fontWeight = FontWeight.Medium, // md.sys.typescale.title-medium.weight, md.ref.typeface.weight-medium
        fontSize = 16.sp, // md.sys.typescale.title-medium.size
        lineHeight = 24.sp, // md.sys.typescale.title-medium.line-height
        letterSpacing = 0.2.sp, // md.sys.typescale.title-medium.tracking
    ),
    titleSmall = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.title-small.font, md.ref.typeface.plain
        fontWeight = FontWeight.Medium, // md.sys.typescale.title-small.weight, md.ref.typeface.weight-medium
        fontSize = 14.sp, // md.sys.typescale.title-small.size
        lineHeight = 20.sp, // md.sys.typescale.title-small.line-height
        letterSpacing = 0.1.sp, // md.sys.typescale.title-small.tracking
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.body-large.font, md.ref.typeface.plain
        fontWeight = FontWeight.Normal, // md.sys.typescale.body-large.weight, md.ref.typeface.weight-regular
        fontSize = 16.sp, // md.sys.typescale.body-large.size
        lineHeight = 24.sp, // md.sys.typescale.body-large.line-height
        letterSpacing = 0.5.sp, // md.sys.typescale.body-large.tracking
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.body-medium.font, md.ref.typeface.plain
        fontWeight = FontWeight.Normal, // md.sys.typescale.body-medium.weight, md.ref.typeface.weight-regular
        fontSize = 14.sp, // md.sys.typescale.body-medium.size
        lineHeight = 20.sp, // md.sys.typescale.body-medium.line-height
        letterSpacing = 0.2.sp, // md.sys.typescale.body-medium.tracking
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.body-small.font, md.ref.typeface.plain
        fontWeight = FontWeight.Normal, // md.sys.typescale.body-small.weight, md.ref.typeface.weight-regular
        fontSize = 12.sp, // md.sys.typescale.body-small.size
        lineHeight = 16.sp, // md.sys.typescale.body-small.line-height
        letterSpacing = 0.4.sp, // md.sys.typescale.body-small.tracking
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.label-large.font, md.ref.typeface.plain
        fontWeight = FontWeight.Medium, // md.sys.typescale.label-large.weight, md.ref.typeface.weight-medium
        fontSize = 14.sp, // md.sys.typescale.label-large.size
        lineHeight = 20.sp, // md.sys.typescale.label-large.line-height
        letterSpacing = 0.1.sp, // md.sys.typescale.label-large.tracking
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.label-medium.font, md.ref.typeface.plain
        fontWeight = FontWeight.Medium, // md.sys.typescale.label-medium.weight, md.ref.typeface.weight-medium
        fontSize = 12.sp, // md.sys.typescale.label-medium.size
        lineHeight = 16.sp, // md.sys.typescale.label-medium.line-height
        letterSpacing = 0.5.sp, // md.sys.typescale.label-medium.tracking
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.label-small.font, md.ref.typeface.plain
        fontWeight = FontWeight.Medium, // md.sys.typescale.label-small.weight, md.ref.typeface.weight-medium
        fontSize = 11.sp, // md.sys.typescale.label-small.size
        lineHeight = 16.sp, // md.sys.typescale.label-small.line-height
        letterSpacing = 0.5.sp, // md.sys.typescale.label-small.tracking
    ),
)

/** The emphasized type scale of Material 3 Expressive: M3EmphasizedType.titleLarge. */
object M3EmphasizedType {
    val displayLarge: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.display-large.font, md.ref.typeface.brand
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.display-large.weight, md.ref.typeface.weight-medium
        fontSize = 57.sp, // md.sys.typescale.emphasized.display-large.size
        lineHeight = 64.sp, // md.sys.typescale.emphasized.display-large.line-height
        letterSpacing = 0.sp, // md.sys.typescale.emphasized.display-large.tracking
    )
    val displayMedium: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.display-medium.font, md.ref.typeface.brand
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.display-medium.weight, md.ref.typeface.weight-medium
        fontSize = 45.sp, // md.sys.typescale.emphasized.display-medium.size
        lineHeight = 52.sp, // md.sys.typescale.emphasized.display-medium.line-height
        letterSpacing = 0.sp, // md.sys.typescale.emphasized.display-medium.tracking
    )
    val displaySmall: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.display-small.font, md.ref.typeface.brand
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.display-small.weight, md.ref.typeface.weight-medium
        fontSize = 36.sp, // md.sys.typescale.emphasized.display-small.size
        lineHeight = 44.sp, // md.sys.typescale.emphasized.display-small.line-height
        letterSpacing = 0.sp, // md.sys.typescale.emphasized.display-small.tracking
    )
    val headlineLarge: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.headline-large.font, md.ref.typeface.brand
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.headline-large.weight, md.ref.typeface.weight-medium
        fontSize = 32.sp, // md.sys.typescale.emphasized.headline-large.size
        lineHeight = 40.sp, // md.sys.typescale.emphasized.headline-large.line-height
        letterSpacing = 0.sp, // md.sys.typescale.emphasized.headline-large.tracking
    )
    val headlineMedium: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.headline-medium.font, md.ref.typeface.brand
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.headline-medium.weight, md.ref.typeface.weight-medium
        fontSize = 28.sp, // md.sys.typescale.emphasized.headline-medium.size
        lineHeight = 36.sp, // md.sys.typescale.emphasized.headline-medium.line-height
        letterSpacing = 0.sp, // md.sys.typescale.emphasized.headline-medium.tracking
    )
    val headlineSmall: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.headline-small.font, md.ref.typeface.brand
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.headline-small.weight, md.ref.typeface.weight-medium
        fontSize = 24.sp, // md.sys.typescale.emphasized.headline-small.size
        lineHeight = 32.sp, // md.sys.typescale.emphasized.headline-small.line-height
        letterSpacing = 0.sp, // md.sys.typescale.emphasized.headline-small.tracking
    )
    val titleLarge: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.title-large.font, md.ref.typeface.brand
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.title-large.weight, md.ref.typeface.weight-medium
        fontSize = 22.sp, // md.sys.typescale.emphasized.title-large.size
        lineHeight = 28.sp, // md.sys.typescale.emphasized.title-large.line-height
        letterSpacing = 0.sp, // md.sys.typescale.emphasized.title-large.tracking
    )
    val titleMedium: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.title-medium.font, md.ref.typeface.plain
        fontWeight = FontWeight.Bold, // md.sys.typescale.emphasized.title-medium.weight, md.ref.typeface.weight-bold
        fontSize = 16.sp, // md.sys.typescale.emphasized.title-medium.size
        lineHeight = 24.sp, // md.sys.typescale.emphasized.title-medium.line-height
        letterSpacing = 0.15.sp, // md.sys.typescale.emphasized.title-medium.tracking
    )
    val titleSmall: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.title-small.font, md.ref.typeface.plain
        fontWeight = FontWeight.Bold, // md.sys.typescale.emphasized.title-small.weight, md.ref.typeface.weight-bold
        fontSize = 14.sp, // md.sys.typescale.emphasized.title-small.size
        lineHeight = 20.sp, // md.sys.typescale.emphasized.title-small.line-height
        letterSpacing = 0.1.sp, // md.sys.typescale.emphasized.title-small.tracking
    )
    val bodyLarge: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.body-large.font, md.ref.typeface.plain
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.body-large.weight, md.ref.typeface.weight-medium
        fontSize = 16.sp, // md.sys.typescale.emphasized.body-large.size
        lineHeight = 24.sp, // md.sys.typescale.emphasized.body-large.line-height
        letterSpacing = 0.15.sp, // md.sys.typescale.emphasized.body-large.tracking
    )
    val bodyMedium: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.body-medium.font, md.ref.typeface.plain
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.body-medium.weight, md.ref.typeface.weight-medium
        fontSize = 14.sp, // md.sys.typescale.emphasized.body-medium.size
        lineHeight = 20.sp, // md.sys.typescale.emphasized.body-medium.line-height
        letterSpacing = 0.25.sp, // md.sys.typescale.emphasized.body-medium.tracking
    )
    val bodySmall: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.body-small.font, md.ref.typeface.plain
        fontWeight = FontWeight.Medium, // md.sys.typescale.emphasized.body-small.weight, md.ref.typeface.weight-medium
        fontSize = 12.sp, // md.sys.typescale.emphasized.body-small.size
        lineHeight = 16.sp, // md.sys.typescale.emphasized.body-small.line-height
        letterSpacing = 0.4.sp, // md.sys.typescale.emphasized.body-small.tracking
    )
    val labelLarge: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.label-large.font, md.ref.typeface.plain
        fontWeight = FontWeight.Bold, // md.sys.typescale.emphasized.label-large.weight, md.ref.typeface.weight-bold
        fontSize = 14.sp, // md.sys.typescale.emphasized.label-large.size
        lineHeight = 20.sp, // md.sys.typescale.emphasized.label-large.line-height
        letterSpacing = 0.1.sp, // md.sys.typescale.emphasized.label-large.tracking
    )
    val labelMedium: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.label-medium.font, md.ref.typeface.plain
        fontWeight = FontWeight.Bold, // md.sys.typescale.emphasized.label-medium.weight, md.ref.typeface.weight-bold
        fontSize = 12.sp, // md.sys.typescale.emphasized.label-medium.size
        lineHeight = 16.sp, // md.sys.typescale.emphasized.label-medium.line-height
        letterSpacing = 0.5.sp, // md.sys.typescale.emphasized.label-medium.tracking
    )
    val labelSmall: TextStyle = TextStyle(
        fontFamily = FontFamily.SansSerif, // md.sys.typescale.emphasized.label-small.font, md.ref.typeface.plain
        fontWeight = FontWeight.Bold, // md.sys.typescale.emphasized.label-small.weight, md.ref.typeface.weight-bold
        fontSize = 11.sp, // md.sys.typescale.emphasized.label-small.size
        lineHeight = 16.sp, // md.sys.typescale.emphasized.label-small.line-height
        letterSpacing = 0.5.sp, // md.sys.typescale.emphasized.label-small.tracking
    )
}
