import {
  ExtensionCodeBlock,
  Plugin,
  PluginKey,
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

type Highlighter = HighlighterGeneric<BundledLanguage, BundledTheme>;

export interface ExtensionShikiOptions extends ExtensionCodeBlockOptions {
  /**
   * shiki highlighter instance
   */
  highlighter: Highlighter;
}

let highlighter: HighlighterGeneric<BundledLanguage, BundledTheme>;
let theme = "vitesse-dark";
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

export const ExtensionShiki = ExtensionCodeBlock.extend<ExtensionShikiOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      highlighter,
      defaultLanguage: null,
      languages: Object.keys(bundledLanguages).map((key) => {
        return {
          label: key,
          value: key,
        };
      }),
    };
  },
  addProseMirrorPlugin() {
    return new Plugin({
      key: new PluginKey("shiki"),
    });
  },
});
