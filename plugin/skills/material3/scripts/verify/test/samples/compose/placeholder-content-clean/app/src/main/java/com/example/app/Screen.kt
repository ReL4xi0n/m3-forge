package com.example.app

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable

@Composable
fun Screen() {
    Column {
        Text("Mara Lindqvist")
        Text("you@lumenfold.app")
        Button(onClick = {}) { Text("Pay") }
        Text("Navigation bar")
    }
}
