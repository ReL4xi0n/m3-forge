package com.example.app

import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.painterResource

@Composable
fun Screen() {
    Row {
        Icon(painterResource(R.drawable.ic_home), contentDescription = "Home")
        Text("Done")
    }
}
