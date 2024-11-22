import {
  findChildren,
  PMNode,
  Plugin,
  PluginKey,
  Decoration,
  DecorationSet,
} from "@halo-dev/richtext-editor";

import {
  type HighlighterGeneric,
  type BundledLanguage,
  type BundledTheme,
  bundledLanguages,
} from "shiki";

type Highlighter = HighlighterGeneric<BundledLanguage, BundledTheme>;

function parseNodes(
  nodes: any[],
  style: string = "",
): { text: string; style: string }[] {
  return nodes
    .map((node) => {
      if (node.children) {
        return parseNodes(node.children, node.properties?.style ?? "");
      }

      return {
        text: node.value,
        style:
          (style === "" ? "" : style + ";") + (node.properties?.style ?? ""),
      };
    })
    .flat();
}

function getHighlightNodes(result: any) {
  // `.value` for lowlight v1, `.children` for lowlight v2
  return result.children[0].children[0].children;
}

function hexToRgbaStyle(input: string): string {
  if (/color:\s*rgba?\([\d\s,\.]+\);?/i.test(input)) {
    return input;
  }

  const regex = /(color:\s*)#([0-9a-fA-F]{6,8})(;?)/;

  return input.replace(regex, (_, prefix, hex, suffix) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    if (hex.length === 8) {
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return `${prefix}rgba(${r},${g},${b},${a.toFixed(2)})${suffix}`;
    }

    return `${prefix}rgb(${r},${g},${b})${suffix}`;
  });
}

function getDecorations({
  doc,
  name,
  theme,
  lowlight,
  defaultLanguage,
}: {
  doc: PMNode;
  name: string;
  theme: BundledTheme;
  lowlight: Highlighter;
  defaultLanguage: string | null | undefined;
}) {
  const decorations: Decoration[] = [];

  findChildren(doc, (node) => node.type.name === name).forEach((block) => {
    let from = block.pos + 1;
    const language = block.node.attrs.language || defaultLanguage;
    const languages = Object.keys(bundledLanguages);

    const nodes =
      language && languages.includes(language)
        ? getHighlightNodes(
            lowlight.codeToHast(block.node.textContent, {
              lang: language,
              theme,
            }),
          )
        : getHighlightNodes(
            lowlight.codeToHast(block.node.textContent, {
              lang: "typescript",
              theme,
            }),
          );

    parseNodes(nodes).forEach((node) => {
      if (node.text) {
        console.log("node: ", node);
        const to = from + node.text.length;

        if (node.style !== "") {
          const decoration = Decoration.inline(from, to, {
            style: node.style,
          });
          console.log("decoration: ", decoration);

          decorations.push(decoration);
        }

        from = to;
      }
    });
  });

  return DecorationSet.create(doc, decorations);
}

function isFunction(param: any) {
  return typeof param === "function";
}

export function LowlightPlugin({
  name,
  theme,
  lowlight,
  defaultLanguage,
}: {
  name: string;
  theme: BundledTheme;
  lowlight: Highlighter;
  defaultLanguage: string | null | undefined;
}) {
  if (lowlight && !isFunction(lowlight["codeToHast"])) {
    throw Error(
      "You should provide an instance of lowlight to use the code-block-lowlight extension",
    );
  }

  const lowlightPlugin: Plugin<any> = new Plugin({
    key: new PluginKey("custom-lowlight"),

    state: {
      init: (_, { doc }) =>
        getDecorations({
          doc,
          name,
          theme,
          lowlight,
          defaultLanguage,
        }),
      apply: (transaction, decorationSet, oldState, newState) => {
        const oldNodeName = oldState.selection.$head.parent.type.name;
        const newNodeName = newState.selection.$head.parent.type.name;
        const oldNodes = findChildren(
          oldState.doc,
          (node) => node.type.name === name,
        );
        const newNodes = findChildren(
          newState.doc,
          (node) => node.type.name === name,
        );

        if (
          transaction.docChanged &&
          // Apply decorations if:
          // selection includes named node,
          ([oldNodeName, newNodeName].includes(name) ||
            // OR transaction adds/removes named node,
            newNodes.length !== oldNodes.length ||
            // OR transaction has changes that completely encapsulte a node
            // (for example, a transaction that affects the entire document).
            // Such transactions can happen during collab syncing via y-prosemirror, for example.
            transaction.steps.some((step) => {
              return (
                // @ts-ignore
                step.from !== undefined &&
                // @ts-ignore
                step.to !== undefined &&
                oldNodes.some((node) => {
                  // @ts-ignore
                  return (
                    // @ts-ignore
                    node.pos >= step.from &&
                    // @ts-ignore
                    node.pos + node.node.nodeSize <= step.to
                  );
                })
              );
            }))
        ) {
          return getDecorations({
            doc: transaction.doc,
            name,
            theme,
            lowlight,
            defaultLanguage,
          });
        }

        return decorationSet.map(transaction.mapping, transaction.doc);
      },
    },

    props: {
      decorations(state) {
        return lowlightPlugin.getState(state);
      },
    },
  });

  return lowlightPlugin;
}
