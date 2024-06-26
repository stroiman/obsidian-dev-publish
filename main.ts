import {
  App,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  requestUrl,
  Setting,
} from "obsidian";
import MediumGateway from "src/medium-gateway";
import { GetFrontMatterInfo } from "src/obsidian-implementations";
import Publisher from "src/publisher";

// Remember to rename these classes and interfaces!

interface DevPublishPluginSessings {
  apiKey: string;
}

const DEFAULT_SETTINGS: DevPublishPluginSessings = {
  apiKey: "",
};

export default class DevPublishPlugin extends Plugin {
  settings: DevPublishPluginSessings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "publish-current-note",
      name: "Create/update article",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.file) {
          if (!checking) {
            const publisher = new Publisher(
              this.app,
              new MediumGateway(this.settings.apiKey, requestUrl),
              new GetFrontMatterInfo(),
            );
            publisher.publish(view.file).then(
              () => {
                console.log("Stuff published to dev.to");
              },
              (err) => {
                console.error("Error publishing to dev.to", err);
                new Notice("Publish to DEV: Creating/updating DEV article failed. \nPlease check your access token, and try again.\nIf you wish to file a bug report, please see the project readme page.", 0);
              }
            );
          }
          return true;
        }
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new DevPublishSettingTab(this.app, this));
  }

  onunload() { }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class DevPublishSettingTab extends PluginSettingTab {
  plugin: DevPublishPlugin;

  constructor(app: App, plugin: DevPublishPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("API Key")
      .setDesc(
        "SECURITY WARNING! This will be stored unencrypted in your obsidian plugin folder. Do not use this plugin if you do not fully understand the security implications of this.",
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
