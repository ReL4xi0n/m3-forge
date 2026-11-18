// Compose screenshot step of the material3 skill: Gradle init script (adapted from the capture
// harness of this repository). compose.mjs applies it with --init-script to a temporary COPY of the
// project; the project's own files are never edited. For every module that applies
// com.android.application it:
//   - adds Robolectric, Roborazzi and Roborazzi's ATF accessibility check to testImplementation;
//   - sets android.testOptions.unitTests.isIncludeAndroidResources = true;
//   - adds the generated test folder (M3ShotsTest, written by compose.mjs) as a unit-test source folder.
// AGP types are not on an init script's classpath, so the android extension is reached through
// reflection.
//
// Project properties (-P):
//   m3.outDir      where the test writes screenshots and result files (required)
//   m3.testSrcDir  folder with the generated test sources (required)
//   m3.launcher    fully qualified launcher activity (optional; else the merged manifest is used)
//   m3.statesFile  JSON file with the interaction states (optional)

val m3Pins = listOf(
    "junit:junit:4.13.2",
    "androidx.test:core:1.7.0",
    "org.robolectric:robolectric:4.17",
    "io.github.takahirom.roborazzi:roborazzi:1.79.0",
    "io.github.takahirom.roborazzi:roborazzi-compose:1.79.0",
    "io.github.takahirom.roborazzi:roborazzi-junit-rule:1.79.0",
    "io.github.takahirom.roborazzi:roborazzi-accessibility-check:1.79.0",
)

val m3Props: Map<String, String> = gradle.startParameter.projectProperties
val m3OutDir: String = m3Props["m3.outDir"]
    ?: throw GradleException("material3 screenshot: pass -Pm3.outDir=<folder for screenshots>")
val m3TestSrcDir: File = m3Props["m3.testSrcDir"]?.let(::File)
    ?: throw GradleException("material3 screenshot: pass -Pm3.testSrcDir=<folder with M3ShotsTest>")
val m3Launcher: String? = m3Props["m3.launcher"]?.takeIf { it.isNotBlank() }
val m3StatesFile: String? = m3Props["m3.statesFile"]?.takeIf { it.isNotBlank() }
// Robolectric downloads android-all jars through its own Maven resolver (default ~/.m2); keep them
// next to the Gradle caches.
val m3RobolectricRepo: File = File(gradle.gradleUserHomeDir, "m3-robolectric-m2")

fun m3Call(target: Any, name: String, vararg args: Any?): Any? {
    val method = target.javaClass.methods.firstOrNull { it.name == name && it.parameterCount == args.size }
        ?: throw GradleException("material3 screenshot: ${target.javaClass.name} has no $name/${args.size}")
    return method.invoke(target, *args)
}

gradle.allprojects {
    // `--tests *M3ShotsTest*` must not fail modules that have no such test.
    tasks.withType(Test::class.java).configureEach {
        filter.isFailOnNoMatchingTests = false
    }

    pluginManager.withPlugin("com.android.application") {
        val android = extensions.getByName("android")

        val unitTests = m3Call(m3Call(android, "getTestOptions")!!, "getUnitTests")!!
        m3Call(unitTests, "setIncludeAndroidResources", true)

        @Suppress("UNCHECKED_CAST")
        val sourceSets = m3Call(android, "getSourceSets") as NamedDomainObjectContainer<Any>
        val testSourceSet = sourceSets.getByName("test")
        val dirs = runCatching { m3Call(testSourceSet, "getKotlin") }.getOrNull()
            ?: m3Call(testSourceSet, "getJava")!!
        m3Call(dirs, "srcDir", m3TestSrcDir)

        m3Pins.forEach { dependencies.add("testImplementation", it) }
        // ATF's ViewChecker API takes Guava's ImmutableSet; ATF's POM puts Guava on the runtime
        // classpath only. Same version as ATF 4.1.1 declares, for compiling M3ShotsTest.
        dependencies.add("testCompileOnly", "com.google.guava:guava:31.0.1-android")

        val tmpDir = layout.buildDirectory.dir("m3-capture/tmp")
        tasks.withType(Test::class.java).configureEach {
            // The generated test is JUnit 4 (Robolectric); a project on the JUnit Platform runs it too.
            useJUnit()
            systemProperty("roborazzi.test.record", "true")
            systemProperty("m3.outDir", m3OutDir)
            if (m3Launcher != null) systemProperty("m3.launcher", m3Launcher)
            if (m3StatesFile != null) systemProperty("m3.statesFile", m3StatesFile)
            systemProperty("maven.repo.local", m3RobolectricRepo.absolutePath)
            val tmp = tmpDir.get().asFile
            jvmArgs("-Djava.io.tmpdir=${tmp.absolutePath}")
            // Robolectric's SDK 36 FileDescriptor interceptor reaches into JDK internals on JDK 21.
            jvmArgs("--add-opens=java.base/jdk.internal.access=ALL-UNNAMED", "--add-opens=java.base/java.io=ALL-UNNAMED")
            // Bounded test JVM: Gradle's default is a quarter of the machine's RAM.
            maxHeapSize = "1536m"
            outputs.upToDateWhen { false }
            doFirst {
                tmp.mkdirs()
                m3RobolectricRepo.mkdirs()
            }
        }
    }
}
