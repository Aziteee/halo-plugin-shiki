package cn.azite.halo.shiki;

import org.springframework.stereotype.Component;
import run.halo.app.plugin.BasePlugin;
import run.halo.app.plugin.PluginContext;

@Component
public class ShikiPlugin extends BasePlugin {
    public ShikiPlugin(PluginContext pluginContext) {
        super(pluginContext);
    }
}
