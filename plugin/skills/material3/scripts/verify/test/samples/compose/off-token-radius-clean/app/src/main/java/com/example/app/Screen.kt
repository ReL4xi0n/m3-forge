package com.example.app

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp

@Composable
fun Screen() {
    Box(Modifier.clip(RoundedCornerShape(12.dp)))
    Box(Modifier.clip(RoundedCornerShape(50)))
    Box(Modifier.clip(CircleShape))
    Box(Modifier.clip(MaterialTheme.shapes.large))
    Box(Modifier.clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)))
}
