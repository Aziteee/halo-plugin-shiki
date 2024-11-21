package cn.azite.halo.shiki;

import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.model.IModel;
import org.thymeleaf.model.IModelFactory;
import org.thymeleaf.processor.element.IElementModelStructureHandler;
import org.thymeleaf.spring6.SpringTemplateEngine;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.PluginContext;
import run.halo.app.plugin.ReactiveSettingFetcher;
import run.halo.app.theme.dialect.TemplateHeadProcessor;

@Component
@RequiredArgsConstructor
public class ShikiHeadProcessor implements TemplateHeadProcessor {

    private final ReactiveSettingFetcher settingFetcher;

    private final PluginContext pluginContext;

    private final TemplateEngine templateEngine = new SpringTemplateEngine();

    @Override
    public Mono<Void> process(ITemplateContext context, IModel model, IElementModelStructureHandler structureHandler) {
        return settingFetcher.fetch(CustomSetting.GROUP, CustomSetting.class)
                .doOnNext(customSetting -> {
                    final IModelFactory modelFactory = context.getModelFactory();
                    model.add(
                            modelFactory.createText(getScript(customSetting.themeLight(), customSetting.themeDark())));
                })
                .then();
    }

    private String getScript(String themeLight, String themeDark) {
        var context = new Context();
        context.setVariable("themeLight", themeLight);
        context.setVariable("themeDark", themeDark);
        context.setVariable("version", pluginContext.getVersion());
        return templateEngine.process(
                """
                            <!-- halo-plugin-shiki start -->
                            <link th:href="|/plugins/halo-plugin-shiki/assets/static/style.css?version=${version}|" rel="stylesheet"/>
                            <script type="module">
                                import { codeToHtml } from "https://esm.sh/shiki@1.22.2";
                                import * as transformers from "https://esm.sh/@shikijs/transformers@1.23.1";
                                console.log("shiki module loaded");
                                const nodes = document.querySelectorAll("pre > code");
                                for (let i = 0; i < nodes.length; i++) {
                                    const node = nodes[i];
                                    let language = "typescript";
                                    if (node.hasAttribute("class")) {
                                        language = node.getAttribute("class").split("-")[1];
                                    }
                                    const codes = await codeToHtml(node.innerText, {
                                        lang: language,
                                        themes: {
                                            light: "[[${themeLight}]]",
                                            dark: "[[${themeDark}]]",
                                        },
                                        transformers: [
                                            transformers.transformerNotationDiff(),
                                            transformers.transformerNotationHighlight(),
                                            transformers.transformerNotationWordHighlight(),
                                            transformers.transformerNotationFocus(),
                                            transformers.transformerNotationErrorLevel(),
                                            transformers.transformerRenderWhitespace(),
                                        ],
                                    })
                                    const el = document.createElement("div");
                                    el.innerHTML = codes;
                                    node.parentNode.replaceWith(el);
                                }
                            </script>
                            <!-- halo-plugin-shiki end -->
                        """,
                context);
    }

    record CustomSetting(String themeLight, String themeDark) {
        public static final String GROUP = "config";
    }
}
