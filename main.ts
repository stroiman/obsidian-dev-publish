import {
  App,
  Editor,
  MarkdownView,
  Modal,
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

interface MyPluginSettings {
  apiKey: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  apiKey: "",
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "publish-current-note",
      name: "Publish current note to dev.to",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.file) {
          if (!checking) {
            const publisher = new Publisher(
              this.app.fileManager,
              new MediumGateway(this.settings.apiKey, requestUrl),
              this.app.vault,
              new GetFrontMatterInfo(),
            );
            publisher.publish(view.file).then(
              () => {
                console.log("Stuff published to dev.to");
              },
              (err) => console.error("Error publishing to dev.to"),
            );
          }
          return true;
        }
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      console.log("click", evt);
    });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(
      window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
    );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("API KEY")
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
