// TypeScript 6.0 turned on `noUncheckedSideEffectImports` by default, which
// requires an explicit ambient declaration for side-effect-only imports
// (e.g. `import "./globals.css"` in app/layout.tsx) that don't export
// anything. This is the fix TypeScript's own docs recommend — see
// https://github.com/microsoft/TypeScript/issues/63181 for the exact issue
// this project hit.
declare module "*.css";
