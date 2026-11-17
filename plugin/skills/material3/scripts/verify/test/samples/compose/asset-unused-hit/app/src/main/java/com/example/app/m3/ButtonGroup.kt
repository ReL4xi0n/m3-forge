// material3 skill asset: assets/compose/components/ButtonGroup.kt HIT
package com.example.app.m3

import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable

@Composable
fun M3ButtonGroup(content: @Composable () -> Unit) {
    Row { content() }
}
