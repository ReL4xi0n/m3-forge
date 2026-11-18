// m3-forge Compose capture harness (spec §10, plan Task 8).
//
// Added to the app module's unit-test sources by roborazzi.init.gradle.kts. It launches the app's
// launcher activity under Robolectric native graphics at 412x915dp / 420dpi, light and +night,
// captures the window with Roborazzi, then runs the ATF hierarchy checks directly through
// ViewChecker, lists clickable Compose semantics nodes under 48dp, and writes it all (never failing
// on findings) to <m3.outDir>/atf-<theme>.json.
// capture.mjs normalizes those results.
package m3forge.harness

import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Looper
import android.provider.Settings
import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import com.github.takahirom.roborazzi.captureRoboImage
import com.google.android.apps.common.testing.accessibility.framework.AccessibilityCheckPreset
import com.google.android.apps.common.testing.accessibility.framework.AccessibilityCheckResult.AccessibilityCheckResultType
import com.google.android.apps.common.testing.accessibility.framework.Parameters
import com.google.android.apps.common.testing.accessibility.framework.ViewChecker
import com.google.android.apps.common.testing.accessibility.framework.utils.contrast.BitmapImage
import java.io.File
import java.time.Duration
import java.util.Locale
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import org.robolectric.shadows.ShadowBuild
import org.robolectric.shadows.ShadowTrace

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], qualifiers = "w412dp-h915dp-420dpi")
class M3CaptureTest {

    @Test
    fun light() = capture("light")

    @Test
    @Config(qualifiers = "+night")
    fun dark() = capture("dark")

    private fun capture(theme: String) {
        val outDir = File(requireNotNull(System.getProperty("m3.outDir")) { "m3.outDir is not set" })
        outDir.mkdirs()
        val context = ApplicationProvider.getApplicationContext<Context>()
        val intent = launchIntent(context)
        disableTraceRecording()
        // Reduced motion, as the web harness emulates it: animator duration scale 0, which Compose reads
        // as its MotionDurationScale. Robolectric runs each vsync inside idle() and moves the clock
        // itself, so an app with an endless animation kept ActivityScenario.launch's idle() busy until
        // something failed (baseline landing and onboarding: 20-25 minutes, ended by an
        // OutOfMemoryError in the Recomposer).
        Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 0f)
        runCatching { android.animation.ValueAnimator::class.java.getMethod("setDurationScale", Float::class.javaPrimitiveType).invoke(null, 0f) }

        ActivityScenario.launch<android.app.Activity>(intent).use { scenario ->
            settle()
            lateinit var root: View
            scenario.onActivity { root = it.window.decorView }

            val png = File(outDir, "$theme-$VIEWPORT.png")
            root.captureRoboImage(png.absolutePath)
            check(png.isFile) { "Roborazzi did not write $png (is roborazzi.test.record=true set?)" }

            val report = JSONObject()
                .put("theme", theme)
                .put("activity", intent.component?.className)
                .put("sdk", Build.VERSION.SDK_INT)
                .put("fonts", fontInfo(context))
            try {
                report.put("results", runAtf(root, png))
            } catch (t: Throwable) {
                report.put("results", JSONArray()).put("atfError", t.toString())
            }
            try {
                report.put("semanticsTargets", semanticsTargets(root))
            } catch (t: Throwable) {
                report.put("semanticsTargets", JSONArray()).put("semanticsError", t.toString())
            }
            File(outDir, "atf-$theme.json").writeText(report.toString(2))
        }
    }

    // The class name capture.mjs found in AndroidManifest.xml, else the merged manifest's launcher.
    private fun launchIntent(context: Context): Intent {
        val name = System.getProperty("m3.launcher")?.takeIf { it.isNotBlank() }
        if (name != null) {
            return Intent(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_LAUNCHER)
                .setClassName(context.packageName, name)
        }
        return requireNotNull(context.packageManager.getLaunchIntentForPackage(context.packageName)) {
            "no launcher activity in the merged manifest of ${context.packageName}"
        }
    }

    // Advances the paused main looper by 2 s of frames, so first composition, layout and entry
    // animations finish. Fixed time, not "until idle", so infinite animations cannot hang it.
    private fun settle() {
        val looper = shadowOf(Looper.getMainLooper())
        repeat(SETTLE_FRAMES) {
            looper.idleFor(Duration.ofMillis(16))
            ShadowTrace.reset()
        }
    }

    // Robolectric's ShadowTrace keeps every finished android.os.Trace section in a queue for test
    // assertions. Compose traces each recomposition, so an app with an endless animation filled the
    // test JVM's heap (OutOfMemoryError once the heap was bounded at 1536m; found 2026-11-17).
    // Trace.setAppTracingAllowed(false) sets ShadowTrace's tags to 0, which turns recording off; the
    // reset() in settle() bounds the queue if it does not.
    private fun disableTraceRecording() {
        try {
            android.os.Trace::class.java.getDeclaredMethod("setAppTracingAllowed", Boolean::class.javaPrimitiveType)
                .apply { isAccessible = true }
                .invoke(null, false)
        } catch (_: Throwable) {
            // Hidden API missing: settle() still resets the queue every frame.
        }
        ShadowTrace.reset()
    }

    private fun runAtf(root: View, png: File): JSONArray {
        val bitmap = requireNotNull(BitmapFactory.decodeFile(png.absolutePath)) { "cannot decode $png" }
        // ATF bails out on the "robolectric" fingerprint; Roborazzi uses the same workaround.
        val priorFingerprint = Build.FINGERPRINT
        ShadowBuild.setFingerprint("m3forge/harness")
        try {
            val checks = AccessibilityCheckPreset.getAccessibilityHierarchyChecksForPreset(AccessibilityCheckPreset.LATEST)
            val parameters = Parameters().apply { putScreenCapture(BitmapImage(bitmap)) }
            val results = ViewChecker().setObtainCharacterLocations(true).runChecksOnView(checks, root, parameters)
            val out = JSONArray()
            for (r in results) {
                if (r.type == AccessibilityCheckResultType.NOT_RUN) continue
                val e = r.element
                val item = JSONObject()
                    .put("check", r.sourceCheckClass.simpleName)
                    .put("type", r.type.name)
                    .put("message", r.getMessage(Locale.ENGLISH)?.toString())
                if (e != null) {
                    val b = e.boundsInScreen
                    item.put(
                        "element",
                        JSONObject()
                            .put("className", e.className?.toString())
                            .put("text", e.text?.toString())
                            .put("contentDescription", e.contentDescription?.toString())
                            .put("resourceName", e.resourceName)
                            .put("clickable", e.isClickable)
                            // Compose maps SemanticsProperties.Disabled to AccessibilityNodeInfo.isEnabled == false.
                            .put("enabled", e.isEnabled)
                            .put("bounds", JSONArray(listOf(b.left, b.top, b.right, b.bottom))),
                    )
                }
                out.put(item)
            }
            return out
        } finally {
            ShadowBuild.setFingerprint(priorFingerprint)
        }
    }

    // Every clickable Compose node (merged semantics tree) whose touch target is under 48x48dp.
    // Measurement versions (owner decision 2026-11-18; -Pm3.targets):
    //   touch (v3, default): the node's layout size or, when the node has the
    //     minimumInteractiveComponentSize() modifier, that modifier's bounds (the padding the official
    //     40dp buttons and 32dp chips get): the area a finger can hit by design.
    //   layout (v2): the node's layout size. It reports every official 40dp button and 32dp chip; kept
    //     only to reproduce the old numbers.
    // Disabled nodes carry enabled=false; capture.mjs leaves them out.
    private fun semanticsTargets(root: View): JSONArray {
        val out = JSONArray()
        val density = root.resources.displayMetrics.density
        val minPx = MIN_TARGET_DP * density
        val layoutMeasure = System.getProperty("m3.targets") == "layout"
        for (owner in composeRoots(root)) {
            val stack = ArrayDeque<SemanticsNode>().apply { add(owner.semanticsOwner.rootSemanticsNode) }
            while (stack.isNotEmpty()) {
                val node = stack.removeLast()
                stack.addAll(node.children)
                val config = node.config
                if (SemanticsActions.OnClick !in config && SemanticsActions.OnLongClick !in config) continue
                val (w, h) = if (layoutMeasure) node.size.width.toFloat() to node.size.height.toFloat() else touchSize(node)
                if (w + 0.5f >= minPx && h + 0.5f >= minPx) continue
                val b = node.boundsInWindow
                val label = config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString(" ")
                    ?: config.getOrNull(SemanticsProperties.Text)?.joinToString(" ") { it.text }
                out.put(
                    JSONObject()
                        .put("label", label)
                        .put("role", config.getOrNull(SemanticsProperties.Role)?.toString())
                        .put("enabled", SemanticsProperties.Disabled !in config)
                        .put("widthDp", Math.round(w / density * 10) / 10.0)
                        .put("heightDp", Math.round(h / density * 10) / 10.0)
                        .put("measure", if (layoutMeasure) "layout" else "touch")
                        .put("bounds", JSONArray(listOf(b.left.toInt(), b.top.toInt(), b.right.toInt(), b.bottom.toInt()))),
                )
            }
        }
        return out
    }

    // The touch target of a clickable node: the larger of its layout size and the bounds of the
    // minimumInteractiveComponentSize() modifier on the same layout node (the padding the official
    // buttons, chips and icon buttons get). Compose's own pointer-input expansion to 48dp is left out on
    // purpose: SemanticsNode.touchBoundsInRoot includes it, so every clickable, even a bare 32dp box,
    // would report 48dp and the check could never fire.
    private fun touchSize(node: SemanticsNode): Pair<Float, Float> {
        var w = node.size.width.toFloat()
        var h = node.size.height.toFloat()
        val infos = runCatching { node.layoutInfo.getModifierInfo() }.getOrDefault(emptyList())
        for (info in infos) {
            if (!info.modifier.javaClass.name.contains("MinimumInteractive")) continue
            w = maxOf(w, info.coordinates.size.width.toFloat())
            h = maxOf(h, info.coordinates.size.height.toFloat())
        }
        return w to h
    }

    private fun composeRoots(view: View): List<ViewRootForTest> {
        val found = mutableListOf<ViewRootForTest>()
        fun visit(v: View) {
            if (v is ViewRootForTest) found += v
            if (v is ViewGroup) for (i in 0 until v.childCount) visit(v.getChildAt(i))
        }
        visit(view)
        return found
    }

    // App fonts are used as they are. Text in FontFamily.Default (or any family the app does not
    // bundle) falls back to Robolectric's native-runtime system fonts; this records which files
    // its fonts.xml maps to sans-serif, and the app's own res/font entries.
    private fun fontInfo(context: Context): JSONObject {
        val info = JSONObject()
        try {
            val tmp = File(System.getProperty("java.io.tmpdir"))
            val fontsXml = tmp.listFiles { f -> f.isDirectory && f.name.startsWith("robolectric-nativeruntime") }
                ?.map { File(it, "fonts/fonts.xml") }
                ?.firstOrNull { it.isFile }
            if (fontsXml == null) {
                info.put("fallbackSansSerif", "NOT FOUND")
            } else {
                val family = Regex("<family name=\"sans-serif\">([\\s\\S]*?)</family>").find(fontsXml.readText())
                val files = family?.let { m -> Regex(">\\s*([^<>\\s]+\\.[ot]tf)\\s*<").findAll(m.groupValues[1]).map { it.groupValues[1] }.toList() }
                info.put("fallbackSansSerif", if (files.isNullOrEmpty()) "NOT FOUND" else JSONArray(files))
                info.put("fallbackSource", "robolectric-nativeruntime fonts/fonts.xml")
            }
        } catch (t: Throwable) {
            info.put("fallbackError", t.toString())
        }
        try {
            val fontClass = Class.forName("${context.packageName}.R\$font")
            info.put("appFontResources", JSONArray(fontClass.fields.map { it.name }.sorted()))
        } catch (_: ClassNotFoundException) {
            info.put("appFontResources", JSONArray())
        }
        return info
    }

    private companion object {
        const val VIEWPORT = "412x915"
        const val SETTLE_FRAMES = 125
        const val MIN_TARGET_DP = 48f
    }
}
