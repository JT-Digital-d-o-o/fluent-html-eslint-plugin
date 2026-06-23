// AUTO-GENERATED from fluent-html/class-vocab (C-05) by scripts/gen-vocab.mjs.
// Do NOT edit by hand — run `npm run gen:vocab`. Pinned by test/vocab-drift.mjs.
/* eslint-disable */

/** Every fluent styling method name (the C-05 class-vocab source of truth). */
export const VOCAB_METHODS: readonly string[] = ["alignItems","alignSelf","animate","antialiased","aspect","backdropBlur","backdropBrightness","backdropContrast","backdropGrayscale","backdropHueRotate","backdropInvert","backdropSaturate","backdropSepia","background","blur","bold","border","borderColor","borderStyle","bottom","breakAll","brightness","capitalize","colSpan","containerQuery","contrast","cursor","display","divideX","divideY","duration","ease","flex","flex1","flexDirection","flexWrap","fontFamily","fontWeight","from","gap","gradient","gradientConic","gradientRadial","gradientTo","grayscale","grid","gridAutoCols","gridAutoFlow","gridAutoRows","gridCols","gridRows","group","grow","h","hidden","hueRotate","inset","invert","italic","justifyContent","leading","left","lineClamp","lineThrough","listStylePosition","listStyleType","lowercase","margin","maxH","maxW","minH","minW","neg","noUnderline","objectFit","opacity","order","outline","outlineHidden","overflow","overscroll","padding","peer","placeContent","placeItems","placeSelf","pointerEvents","position","resize","right","ring","ringColor","rotate","rounded","saturate","scale","select","sepia","shadow","shadowColor","shrink","skewX","skewY","spaceX","spaceY","srOnly","tabularNums","textAlign","textColor","textSize","to","top","tracking","transition","translate","truncate","underline","underlineOffset","uppercase","via","w","whitespace","willChange","zIndex"];

/** Methods supporting the `(unit, amount)` arbitrary-value overload. */
export const UNIT_METHODS: ReadonlySet<string> = new Set(["bottom","gap","h","inset","left","margin","maxH","maxW","minH","minW","padding","right","top","w"]);

/** Methods that append classes (a later `setClass` would clobber them) — vocab + variant/callback methods. */
export const FLUENT_MODIFIERS: ReadonlySet<string> = new Set([
  ...VOCAB_METHODS,
  "on",
  "at",
  "addClass",
  "apply",
  "when",
]);
