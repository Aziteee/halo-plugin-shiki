import type { HighlighterGeneric, BundledLanguage, BundledTheme } from "shiki";

export function ShikiPlugin({
  name,
  highlighter,
  defaultLanguage,
}: {
  name: string;
  highlighter: HighlighterGeneric<BundledLanguage, BundledTheme>;
  defaultLanguage: string | null | undefined;
}) {
  
}
