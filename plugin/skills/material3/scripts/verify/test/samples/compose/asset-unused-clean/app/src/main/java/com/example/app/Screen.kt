package com.example.app

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.material3.Icon
import androidx.compose.ui.res.painterResource
import com.example.app.m3.M3ButtonGroup

@Composable
fun Screen() {
    Column {
        M3ButtonGroup {
            Icon(painterResource(R.drawable.m3s_home), contentDescription = "Home")
        }
    }
}
