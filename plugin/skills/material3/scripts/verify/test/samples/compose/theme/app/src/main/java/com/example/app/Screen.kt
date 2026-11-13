package com.example.app

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun Screen() {
    Text("Themed", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.primary)
}
