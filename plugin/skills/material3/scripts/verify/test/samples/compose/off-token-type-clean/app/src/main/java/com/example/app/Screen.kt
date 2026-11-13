package com.example.app

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun Screen() {
    Column {
        Text("Title", style = MaterialTheme.typography.titleLarge)
        Text("Body", style = MaterialTheme.typography.bodyLarge)
    }
}
