package com.example.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp

@Composable
fun Screen() {
    val cs = MaterialTheme.colorScheme
    Box(Modifier.shadow(8.dp, MaterialTheme.shapes.medium)) // HIT
    Box(Modifier.background(Brush.verticalGradient(listOf(cs.primary, cs.tertiary)))) // HIT
}
