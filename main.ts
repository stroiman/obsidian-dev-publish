import {
  App,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  requestUrl,
  sanitizeHTMLToDom,
  SecretComponent,
  Setting
} from "obsidian";
import { TheDialogController } from "src/image-mapping-dialog";
import MediumGateway from "src/medium-gateway";
import { GetFrontMatterInfo } from "src/obsidian-implementations";
import Publisher from "src/publisher";

interface DevPublishPluginSettings {
  apiKey: string;
}

const DEFAULT_SETTINGS: DevPublishPluginSettings = {
  apiKey: "",
};

export default class DevPublishPlugin extends Plugin {
  settings: DevPublishPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "map-image-files",
      name: "Map embedded images to public URLs",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.file) {
          if (!checking) {
            const apiKey = this.getApiKey();
            if (!apiKey) return;
            const publisher = new Publisher(
              this.app,
              new MediumGateway(apiKey, requestUrl),
              new GetFrontMatterInfo(),
            );
            publisher.mapImages(view.file, new TheDialogController(this.app));
          }
          return true;
        }
      },
    });
    this.addCommand({
      id: "publish-current-note",
      name: "Create/update article",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.file) {
          if (!checking) {
            const apiKey = this.getApiKey();
            if (!apiKey) return;
            const publisher = new Publisher(
              this.app,
              new MediumGateway(apiKey, requestUrl),
              new GetFrontMatterInfo(),
            );
            publisher.publish(view.file).then(
              () => {
                console.log("Article published to dev.to");
              },
              (err) => {
                console.error("Error publishing to dev.to", err);
                new Notice(
                  "Publish to DEV: Creating/updating DEV article failed. \nPlease check your access token, and try again.\nIf you wish to file a bug report, please see the project readme page.",
                  0,
                );
              },
            );
          }
          return true;
        }
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new DevPublishSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  getApiKey(): string | null {
    const apiKey = this.app.secretStorage.getSecret(this.settings.apiKey) || "";
    if (!apiKey || apiKey.trim() === "") {
      new Notice("DEV Publish: API key is missing. Please check your plugin settings.");
      return null;
    }
    return apiKey;
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
      .setName("API key")
      .setDesc(
        sanitizeHTMLToDom(
          "Select or enter your DEV.to API key.",
        ),
      )
      .addComponent((el) => 
				new SecretComponent(this.app, el)
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					})
			);
  }
}
