// material3 skill asset: assets/compose/theme/Motion.kt
// Material 3 motion: springs (standard and expressive), durations, easings (Compose).
// Built from the skill token files (tokens/sys.json); generated, do not edit.
// Placeholder package: install-assets rewrites it to the project's theme package.
package m3.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.SpringSpec
import androidx.compose.animation.core.spring

/** A spring from the motion tokens: stiffness and damping ratio. */
class M3Spring(val stiffness: Float, val dampingRatio: Float) {
    fun <T> spec(): SpringSpec<T> = spring(dampingRatio = dampingRatio, stiffness = stiffness)
}

/** One motion scheme: spatial springs move things, effects springs change color and opacity. */
class M3MotionScheme(
    val fastSpatial: M3Spring,
    val fastEffects: M3Spring,
    val defaultSpatial: M3Spring,
    val defaultEffects: M3Spring,
    val slowSpatial: M3Spring,
    val slowEffects: M3Spring,
)

/** Material 3 motion tokens: the expressive scheme (default) and the standard scheme (Classic). */
object M3Motion {
    val standard: M3MotionScheme = M3MotionScheme(
        fastSpatial = M3Spring(stiffness = 1400f, dampingRatio = 0.9f), // md.sys.motion.spring.fast.spatial.stiffness@standard, md.sys.motion.spring.fast.spatial.damping@standard
        fastEffects = M3Spring(stiffness = 3800f, dampingRatio = 1f), // md.sys.motion.spring.fast.effects.stiffness@standard, md.sys.motion.spring.fast.effects.damping@standard
        defaultSpatial = M3Spring(stiffness = 700f, dampingRatio = 0.9f), // md.sys.motion.spring.default.spatial.stiffness@standard, md.sys.motion.spring.default.spatial.damping@standard
        defaultEffects = M3Spring(stiffness = 1600f, dampingRatio = 1f), // md.sys.motion.spring.default.effects.stiffness@standard, md.sys.motion.spring.default.effects.damping@standard
        slowSpatial = M3Spring(stiffness = 300f, dampingRatio = 0.9f), // md.sys.motion.spring.slow.spatial.stiffness@standard, md.sys.motion.spring.slow.spatial.damping@standard
        slowEffects = M3Spring(stiffness = 800f, dampingRatio = 1f), // md.sys.motion.spring.slow.effects.stiffness@standard, md.sys.motion.spring.slow.effects.damping@standard
    )

    val expressive: M3MotionScheme = M3MotionScheme(
        fastSpatial = M3Spring(stiffness = 800f, dampingRatio = 0.6f), // md.sys.motion.spring.fast.spatial.stiffness@expressive, md.sys.motion.spring.fast.spatial.damping@expressive
        fastEffects = M3Spring(stiffness = 3800f, dampingRatio = 1f), // md.sys.motion.spring.fast.effects.stiffness@expressive, md.sys.motion.spring.fast.effects.damping@expressive
        defaultSpatial = M3Spring(stiffness = 380f, dampingRatio = 0.8f), // md.sys.motion.spring.default.spatial.stiffness@expressive, md.sys.motion.spring.default.spatial.damping@expressive
        defaultEffects = M3Spring(stiffness = 1600f, dampingRatio = 1f), // md.sys.motion.spring.default.effects.stiffness@expressive, md.sys.motion.spring.default.effects.damping@expressive
        slowSpatial = M3Spring(stiffness = 200f, dampingRatio = 0.8f), // md.sys.motion.spring.slow.spatial.stiffness@expressive, md.sys.motion.spring.slow.spatial.damping@expressive
        slowEffects = M3Spring(stiffness = 800f, dampingRatio = 1f), // md.sys.motion.spring.slow.effects.stiffness@expressive, md.sys.motion.spring.slow.effects.damping@expressive
    )

    // Durations in milliseconds (tween(durationMillis = ...)).
    const val durationShort1Millis: Int = 50 // md.sys.motion.duration.short1
    const val durationShort2Millis: Int = 100 // md.sys.motion.duration.short2
    const val durationShort3Millis: Int = 150 // md.sys.motion.duration.short3
    const val durationShort4Millis: Int = 200 // md.sys.motion.duration.short4
    const val durationMedium1Millis: Int = 250 // md.sys.motion.duration.medium1
    const val durationMedium2Millis: Int = 300 // md.sys.motion.duration.medium2
    const val durationMedium3Millis: Int = 350 // md.sys.motion.duration.medium3
    const val durationMedium4Millis: Int = 400 // md.sys.motion.duration.medium4
    const val durationLong1Millis: Int = 450 // md.sys.motion.duration.long1
    const val durationLong2Millis: Int = 500 // md.sys.motion.duration.long2
    const val durationLong3Millis: Int = 550 // md.sys.motion.duration.long3
    const val durationLong4Millis: Int = 600 // md.sys.motion.duration.long4
    const val durationExtraLong1Millis: Int = 700 // md.sys.motion.duration.extra-long1
    const val durationExtraLong2Millis: Int = 800 // md.sys.motion.duration.extra-long2
    const val durationExtraLong3Millis: Int = 900 // md.sys.motion.duration.extra-long3
    const val durationExtraLong4Millis: Int = 1000 // md.sys.motion.duration.extra-long4

    val easingEmphasized: Easing = CubicBezierEasing(0.2f, 0f, 0f, 1f) // md.sys.motion.easing.emphasized
    val easingEmphasizedAccelerate: Easing = CubicBezierEasing(0.3f, 0f, 0.8f, 0.15f) // md.sys.motion.easing.emphasized.accelerate
    val easingEmphasizedDecelerate: Easing = CubicBezierEasing(0.05f, 0.7f, 0.1f, 1f) // md.sys.motion.easing.emphasized.decelerate
    val easingLegacy: Easing = CubicBezierEasing(0.4f, 0f, 0.2f, 1f) // md.sys.motion.easing.legacy
    val easingLegacyAccelerate: Easing = CubicBezierEasing(0.4f, 0f, 1f, 1f) // md.sys.motion.easing.legacy.accelerate
    val easingLegacyDecelerate: Easing = CubicBezierEasing(0f, 0f, 0.2f, 1f) // md.sys.motion.easing.legacy.decelerate
    val easingLinear: Easing = CubicBezierEasing(0f, 0f, 1f, 1f) // md.sys.motion.easing.linear
    val easingStandard: Easing = CubicBezierEasing(0.2f, 0f, 0f, 1f) // md.sys.motion.easing.standard
    val easingStandardAccelerate: Easing = CubicBezierEasing(0.3f, 0f, 1f, 1f) // md.sys.motion.easing.standard.accelerate
    val easingStandardDecelerate: Easing = CubicBezierEasing(0f, 0f, 0f, 1f) // md.sys.motion.easing.standard.decelerate
}
