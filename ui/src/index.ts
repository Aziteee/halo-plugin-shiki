import { definePlugin } from "@halo-dev/console-shared";
import { ExtensionShiki } from "./editor/extension-shiki";

export default definePlugin({
  components: {},
  routes: [],
  extensionPoints: {
    "default:editor:extension:create": () => {
      return [ExtensionShiki];
    },
  },
});
