import {
  ExtensionCodeBlock,
  type ExtensionCodeBlockOptions,
} from "@halo-dev/richtext-editor";
import {
  bundledLanguages,
  createHighlighter,
  type BundledLanguage,
  type BundledTheme,
  type HighlighterGeneric,
} from "shiki";
import { coreApiClient } from "@halo-dev/api-client";
import { LowlightPlugin } from "./lowlight-plugin";

let highlighter: HighlighterGeneric<BundledLanguage, BundledTheme>;
let theme: BundledTheme = "vitesse-dark"; // default theme
(async () => {
  const response = await coreApiClient.configMap.getConfigMap({
    name: "halo-plugin-shiki-configmap",
  });
  if (response.data.data?.config) {
    theme = JSON.parse(response.data.data.config).theme;
  }
  highlighter = await createHighlighter({
    themes: [theme],
    langs: Object.keys(bundledLanguages),
  });
})();

export const ExtensionCodeBlockLow =
  ExtensionCodeBlock.extend<ExtensionCodeBlockOptions>({
    addOptions() {
      return {
        ...this.parent?.(),
        defaultLanguage: null,
        languages: Object.keys(bundledLanguages).map((key) => {
          return {
            label: key,
            value: key,
          };
        }),
      };
    },
    addProseMirrorPlugins() {
      return [
        ...(this.parent?.() || []),
        LowlightPlugin({
          name: this.name,
          theme: theme,
          lowlight: highlighter,
          defaultLanguage: this.options.defaultLanguage,
        }),
      ];
    },
  });
