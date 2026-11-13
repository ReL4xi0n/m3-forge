// Invented fixture in Compose's token format.
package androidx.compose.material3.tokens

internal object FilledButtonTokens {
    inline val ContainerColor: ColorToken
        get() = ColorSchemeKeyTokens.Primary
    val ContainerHeight = 40.0.dp
    inline val ContainerShape: ShapeToken
        get() = ShapeKeyTokens.CornerFull
    const val DisabledContainerOpacity = 0.12f
    val LabelTextLineHeight = 20.0.sp
}
