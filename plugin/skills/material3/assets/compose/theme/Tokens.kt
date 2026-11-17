// material3 skill asset: assets/compose/theme/Tokens.kt
// Material 3 elevation and state tokens (Compose).
// Built from the skill token files (tokens/sys.json); generated, do not edit.
// Placeholder package: install-assets rewrites it to the project's theme package.
package m3.theme

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** Elevation levels (tonalElevation / shadowElevation of a Surface). */
object M3Elevation {
    val level0: Dp = 0.dp // md.sys.elevation.level0
    val level1: Dp = 1.dp // md.sys.elevation.level1
    val level2: Dp = 3.dp // md.sys.elevation.level2
    val level3: Dp = 6.dp // md.sys.elevation.level3
    val level4: Dp = 8.dp // md.sys.elevation.level4
    val level5: Dp = 12.dp // md.sys.elevation.level5
}

/** State layer opacities and the focus indicator. */
object M3State {
    const val disabledStateLayerOpacity: Float = 0.38f // md.sys.state.disabled.state-layer-opacity
    const val draggedStateLayerOpacity: Float = 0.16f // md.sys.state.dragged.state-layer-opacity
    val focusIndicatorInnerOffset: Dp = (-3).dp // md.sys.state.focus-indicator.inner-offset
    val focusIndicatorOuterOffset: Dp = 2.dp // md.sys.state.focus-indicator.outer-offset
    val focusIndicatorThickness: Dp = 3.dp // md.sys.state.focus-indicator.thickness
    const val focusStateLayerOpacity: Float = 0.1f // md.sys.state.focus.state-layer-opacity
    const val hoverStateLayerOpacity: Float = 0.08f // md.sys.state.hover.state-layer-opacity
    const val pressedStateLayerOpacity: Float = 0.1f // md.sys.state.pressed.state-layer-opacity
}
