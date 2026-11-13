export class SchemeTonalSpot extends DynamicScheme {
    constructor(sourceColorHct, isDark, contrastLevel, specVersion = DynamicScheme.DEFAULT_SPEC_VERSION, platform = DynamicScheme.DEFAULT_PLATFORM) {
        super({ variant: Variant.TONAL_SPOT, sourceColorHct, isDark });
    }
}
