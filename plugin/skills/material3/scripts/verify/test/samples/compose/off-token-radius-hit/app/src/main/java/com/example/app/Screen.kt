package com.example.app

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp

@Composable
fun Screen() {
    Box(Modifier.clip(RoundedCornerShape(10.dp))) // HIT
    Box(Modifier.clip(RoundedCornerShape(topStart = 6.dp, topEnd = 12.dp))) // HIT
}
