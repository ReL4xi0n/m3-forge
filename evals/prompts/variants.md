# Request variants

The runner builds each prompt from three parts, in this order: the request file, the style line for
the cell's variant, and one line that names the platform and the project folder. The style line
asks for Material 3 explicitly. This way the baseline measures how well Material 3 is built without
the skill, not whether Material 3 is chosen at all. A with-skill run gets the same text through
`/material3`.

- default: Use Material Design 3 in its current M3 Expressive style.
- classic: Use the classic Material 3 style, not M3 Expressive.
- seed: Use Material Design 3 in its current M3 Expressive style, with #B5651D as the brand color.
