// AUTO-GENERATED from fluent-html/class-vocab (C-05) by scripts/gen-vocab.mjs.
// Do NOT edit by hand — run `npm run gen:vocab`. Pinned by test/vocab-drift.mjs.
/* eslint-disable */

/** Every fluent styling method name (the C-05 class-vocab source of truth). */
export const VOCAB_METHODS: readonly string[] = ["absolute","accentColor","alignItems","alignSelf","animate","antialiased","aspect","backdropBlur","backdropBrightness","backdropContrast","backdropGrayscale","backdropHueRotate","backdropInvert","backdropSaturate","backdropSepia","backfaceVisibility","background","bgBlend","block","blur","bold","border","borderColor","borderStyle","bottom","boxDecoration","breakAfter","breakAll","breakBefore","breakInside","brightness","capitalize","caretColor","colEnd","colSpan","colStart","columns","containerQuery","contents","contrast","cursor","decorationColor","decorationStyle","decorationThickness","delay","divideX","divideY","dropShadow","dropShadowColor","duration","ease","fieldSizing","fillColor","fixed","flex","flexDirection","flexShorthand","flexWrap","fontFamily","fontWeight","from","gap","gradient","gradientConic","gradientLinear","gradientRadial","gradientTo","grayscale","grid","gridAutoCols","gridAutoFlow","gridAutoRows","gridCols","gridRows","group","grow","h","hidden","htmxIndicator","hueRotate","hyphens","inline","inlineBlock","inlineFlex","inlineGrid","inset","insetE","insetRing","insetRingColor","insetS","insetShadow","insetShadowColor","insetX","insetY","invert","isolate","isolation","italic","justifyContent","leading","left","lineClamp","lineThrough","listStylePosition","listStyleType","lowercase","margin","maskComposite","maskFrom","maskImage","maskTo","maskType","maxH","maxW","minH","minW","mixBlend","neg","noUnderline","objectFit","opacity","order","outline","outlineHidden","overflow","overscroll","padding","peer","perspective","perspectiveOrigin","placeContent","placeItems","placeSelf","pointerEvents","relative","resize","right","ring","ringColor","rotate","rotateX","rotateY","rotateZ","rounded","rowEnd","rowSpan","rowStart","saturate","scale","scale3d","scaleX","scaleY","scaleZ","scheme","scrollBehavior","scrollMargin","scrollPadding","select","sepia","shadow","shadowColor","shrink","skewX","skewY","snap","snapAlign","snapStop","spaceX","spaceY","srOnly","static","sticky","strokeColor","strokeWidth","tabularNums","textAlign","textColor","textShadow","textShadowColor","textSize","textWrap","to","top","tracking","transformStyle","transition","transitionBehavior","translate","truncate","underline","underlineOffset","uppercase","via","w","whitespace","willChange","zIndex"];

/** Methods supporting the `(unit, amount)` arbitrary-value overload. */
export const UNIT_METHODS: ReadonlySet<string> = new Set(["bottom","decorationThickness","gap","h","inset","insetE","insetS","insetX","insetY","leading","left","margin","maxH","maxW","minH","minW","padding","right","scrollMargin","scrollPadding","strokeWidth","textSize","top","tracking","underlineOffset","w"]);

/** Arbitrary-value CSS units accepted by the `(unit, amount)` overload (lib `UNITS`). */
export const VOCAB_UNITS: readonly string[] = ["%","dvh","em","lvh","px","rem","svh","vh","vw"];

/** Methods that append classes (a later `setClass` would clobber them) — vocab + variant/callback methods. */
export const FLUENT_MODIFIERS: ReadonlySet<string> = new Set([
  ...VOCAB_METHODS,
  "on",
  "at",
  "addClass",
  "apply",
  "when",
]);
