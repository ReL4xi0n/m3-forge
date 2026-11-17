package com.example.app

import androidx.compose.foundation.layout.Row
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

@Composable
fun Toolbar(onClose: () -> Unit) {
    Row {
        IconButton(onClick = onClose) {
            Icon(painterResource(R.drawable.m3s_close), contentDescription = stringResource(R.string.close))
        }
        FilledTonalIconButton(onClick = {}) { Icon(painterResource(R.drawable.m3s_search), "Search") }
        IconButton(onClick = {}, modifier = Modifier.semantics { contentDescription = "Delete" }) {
            Icon(painterResource(R.drawable.m3s_delete), contentDescription = null)
        }
        TextButton(onClick = {}) {
            Icon(painterResource(R.drawable.m3s_add), contentDescription = null)
            Text("New list")
        }
        Icon(painterResource(R.drawable.m3s_home), contentDescription = null)
    }
}
