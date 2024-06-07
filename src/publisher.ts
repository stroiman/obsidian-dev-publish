import {
  GenericFileManager,
  GenericVault,
  GetFrontMatterInfo,
} from "./interfaces";
import MediumGateway from "./medium-gateway";

const ARTICLE_ID_KEY = "dev-article-id";
const ARTICLE_URL_KEY = "dev-url";
const ARTICLE_CANONICAL_URL_KEY = "dev-canonical-url";

export default class Publisher<TFile> {
  fileManager: GenericFileManager<TFile>;
  gateway: MediumGateway;
  getFrontMatterInfo: GetFrontMatterInfo;
  vault: GenericVault<TFile>;

  constructor(
    fileManager: GenericFileManager<TFile>,
    gateway: MediumGateway,
    vault: GenericVault<TFile>,
    getFrontMatterInfo: GetFrontMatterInfo,
  ) {
    this.fileManager = fileManager;
    this.gateway = gateway;
    this.vault = vault;
    this.getFrontMatterInfo = getFrontMatterInfo;
  }

  async publish(file: TFile) {
    const mediumId = await new Promise((resolve, reject) =>
      this.fileManager
        .processFrontMatter(file, (frontmatter) => {
          const mediumId = frontmatter[ARTICLE_ID_KEY];
          // TODO: What if it's not a number?
          resolve(mediumId);
        })
        .catch((err) => reject(err)),
    );
    const fileContents = await this.vault.read(file);
    const frontmatterInfo =
      await this.getFrontMatterInfo.getFrontMatterInfo(fileContents);
    const markdown = frontmatterInfo.exists
      ? fileContents.substring(frontmatterInfo.contentStart)
      : fileContents;
    const article = {
      title: "Article from Obsidian - please rename before publishing",
      markdown: markdown.trim(),
    };
    if (typeof mediumId === "number") {
      await this.gateway.updateArticle({ id: mediumId, article });
    } else {
      const result = await this.gateway.createArticle({ article });
      this.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter[ARTICLE_ID_KEY] = result.id;
        frontmatter[ARTICLE_URL_KEY] = result.url;
        frontmatter[ARTICLE_CANONICAL_URL_KEY] = result.canonicalUrl;
      });
    }
  }
}
