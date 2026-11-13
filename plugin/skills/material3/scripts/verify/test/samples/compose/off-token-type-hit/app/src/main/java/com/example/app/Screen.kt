package com.example.app

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.sp

@Composable
fun Screen() {
    Column {
        Text("Title", fontSize = 22.sp) // HIT
        Text("Body", style = MaterialTheme.typography.bodyLarge.copyWith(fontSize = 15.sp)) // HIT
    }
}
