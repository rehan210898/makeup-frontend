// Font family definitions for Stitch UI
// Using Plus Jakarta Sans for display/body and Playfair Display for headings

export const FONTS = {
  // Display font - Plus Jakarta Sans (modern, clean sans-serif)
  display: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },

  // Serif font - Playfair Display (elegant, editorial headings)
  serif: {
    regular: 'PlayfairDisplay_400Regular',
    medium: 'PlayfairDisplay_500Medium',
    semiBold: 'PlayfairDisplay_600SemiBold',
    bold: 'PlayfairDisplay_700Bold',
    extraBold: 'PlayfairDisplay_800ExtraBold',
    black: 'PlayfairDisplay_900Black',
    italic: 'PlayfairDisplay_400Regular_Italic',
    mediumItalic: 'PlayfairDisplay_500Medium_Italic',
    semiBoldItalic: 'PlayfairDisplay_600SemiBold_Italic',
    boldItalic: 'PlayfairDisplay_700Bold_Italic',
  },

  // Fallback to system fonts when custom fonts aren't loaded
  fallback: {
    display: 'System',
    serif: 'System',
  },
};

// Font sizes following a modular scale
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Line heights
export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// Letter spacing
export const LETTER_SPACING = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.5,
  wider: 1,
};

// Typography presets for common use cases
export const TYPOGRAPHY = {
  // Hero titles
  heroTitle: {
    fontFamily: FONTS.serif.bold,
    fontSize: FONT_SIZES['4xl'],
    lineHeight: LINE_HEIGHTS.tight,
  },
  heroTitleItalic: {
    fontFamily: FONTS.serif.boldItalic,
    fontSize: FONT_SIZES['4xl'],
    lineHeight: LINE_HEIGHTS.tight,
    fontStyle: 'italic' as const,
  },

  // Section titles
  sectionTitle: {
    fontFamily: FONTS.serif.semiBold,
    fontSize: FONT_SIZES['2xl'],
    lineHeight: LINE_HEIGHTS.tight,
  },
  sectionTitleItalic: {
    fontFamily: FONTS.serif.semiBoldItalic,
    fontSize: FONT_SIZES['2xl'],
    lineHeight: LINE_HEIGHTS.tight,
    fontStyle: 'italic' as const,
  },

  // Body text
  bodyLarge: {
    fontFamily: FONTS.display.regular,
    fontSize: FONT_SIZES.lg,
    lineHeight: LINE_HEIGHTS.relaxed,
  },
  body: {
    fontFamily: FONTS.display.regular,
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.normal,
  },
  bodySmall: {
    fontFamily: FONTS.display.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.normal,
  },

  // Labels and buttons
  label: {
    fontFamily: FONTS.display.medium,
    fontSize: FONT_SIZES.sm,
    lineHeight: LINE_HEIGHTS.tight,
  },
  button: {
    fontFamily: FONTS.display.semiBold,
    fontSize: FONT_SIZES.base,
    lineHeight: LINE_HEIGHTS.tight,
  },

  // Prices
  price: {
    fontFamily: FONTS.display.bold,
    fontSize: FONT_SIZES.lg,
    lineHeight: LINE_HEIGHTS.tight,
  },
  priceSmall: {
    fontFamily: FONTS.display.semiBold,
    fontSize: FONT_SIZES.md,
    lineHeight: LINE_HEIGHTS.tight,
  },

  // Badges and tags
  badge: {
    fontFamily: FONTS.display.semiBold,
    fontSize: FONT_SIZES.xs,
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.wide,
  },
};
