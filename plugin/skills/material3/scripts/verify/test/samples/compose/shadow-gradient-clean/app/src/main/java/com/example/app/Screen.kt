package com.example.app

import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

@Composable
fun Screen() {
    Card(elevation = CardDefaults.cardElevation()) {
        Surface(tonalElevation = 4.dp, shadowElevation = 4.dp) {
            Text("Raised")
        }
    }
}
