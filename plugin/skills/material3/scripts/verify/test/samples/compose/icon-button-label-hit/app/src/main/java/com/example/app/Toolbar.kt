package com.example.app

import androidx.compose.foundation.layout.Row
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconToggleButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.painterResource

@Composable
fun Toolbar(onClose: () -> Unit, starred: Boolean, onStar: (Boolean) -> Unit) {
    Row {
        IconButton(onClick = onClose) { // HIT
            Icon(painterResource(R.drawable.m3s_close), contentDescription = null)
        }
        FilledTonalIconButton(onClick = {}) { Icon(painterResource(R.drawable.m3s_search), null) } // HIT
        IconToggleButton(checked = starred, onCheckedChange = onStar) { // HIT
            Icon(
                painter = painterResource(R.drawable.m3s_star),
                contentDescription = null,
            )
        }
        IconButton(onClick = {}) {
            Icon(painterResource(R.drawable.m3s_delete), contentDescription = "Delete")
        }
    }
}
