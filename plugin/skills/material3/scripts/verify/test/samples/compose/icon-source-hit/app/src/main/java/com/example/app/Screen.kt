package com.example.app

import androidx.compose.foundation.layout.Row
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun Screen() {
    Row {
        Icon(Icons.Filled.Home, contentDescription = "Home") // HIT
        Icon(Icons.Default.Add, contentDescription = "Add") // HIT
        Text("Done ✅") // HIT
    }
}
