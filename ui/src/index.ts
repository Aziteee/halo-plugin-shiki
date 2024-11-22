import { definePlugin } from "@halo-dev/console-shared";
import { ExtensionCodeBlockLow } from "./editor/shiki-extension";

export default definePlugin({
  components: {},
  routes: [],
  extensionPoints: {
    "default:editor:extension:create": () => {
      return [ExtensionCodeBlockLow];
    },
  },
});
