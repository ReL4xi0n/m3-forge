package com.example.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun Screen() {
    Column(
        modifier = Modifier.padding(10.dp), // HIT
        verticalArrangement = Arrangement.spacedBy(14.dp), // HIT
    ) {
        Box(Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) // HIT
    }
}
