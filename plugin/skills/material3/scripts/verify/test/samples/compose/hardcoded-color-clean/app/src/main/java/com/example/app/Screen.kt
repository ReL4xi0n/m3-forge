package com.example.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

@Composable
fun Screen() {
    Box(Modifier.background(MaterialTheme.colorScheme.surface)) {
        Text("Hi", color = MaterialTheme.colorScheme.onSurface)
        Box(Modifier.background(Color.Transparent))
    }
}
