import {
  GenericApp,
  GenericFileManager,
  GenericMetadataCache,
  GenericVault,
  GetFrontMatterInfo,
} from "./interfaces";
import MediumGateway from "./medium-gateway";

const ARTICLE_ID_KEY = "dev-article-id";
const ARTICLE_URL_KEY = "dev-url";
const ARTICLE_CANONICAL_URL_KEY = "dev-canonical-url";

export default class Publisher<TFile> {
  app: GenericApp<TFile>;
  fileManager: GenericFileManager<TFile>;
  gateway: MediumGateway;
  getFrontMatterInfo: GetFrontMatterInfo;
  vault: GenericVault<TFile>;

  constructor(
    app: GenericApp<TFile>,
    gateway: MediumGateway,
    getFrontMatterInfo: GetFrontMatterInfo,
  ) {
    this.app = app;
    this.fileManager = app.fileManager;
    this.gateway = gateway;
    this.vault = app.vault;
    this.getFrontMatterInfo = getFrontMatterInfo;
  }

  async getFrontMatter(file: TFile) {
    return new Promise<any>((resolve, reject) => {
      this.fileManager.processFrontMatter(file, resolve).catch(reject);
    });
  }

  async getArticleData(file: TFile) {
    const fileContents = await this.vault.read(file);
    const metadataCache = this.app.metadataCache.getFileCache(file);
    const h1 = metadataCache?.headings?.find((x) => x.level === 1);
    const dataAfterHeading = h1
      ? fileContents.substring(h1.position.end.offset)
      : fileContents;
    const frontmatterInfo =
      await this.getFrontMatterInfo.getFrontMatterInfo(dataAfterHeading);
    const markdown = (
      frontmatterInfo.exists
        ? dataAfterHeading.substring(frontmatterInfo.contentStart)
        : dataAfterHeading
    ).trim();
    return {
      title: h1?.heading || "Heading Missing",
      markdown,
    };
  }

  async updateFrontmatter(file: TFile, newData: any) {
    await this.fileManager.processFrontMatter(file, (existing) => {
      for (const key of Object.keys(newData)) {
        existing[key] = newData[key];
      }
    });
  }

  async publish(file: TFile) {
    const frontmatter = await this.getFrontMatter(file);
    const mediumId = frontmatter[ARTICLE_ID_KEY];
    const article = await this.getArticleData(file);
    if (typeof mediumId === "number") {
      await this.gateway.updateArticle({ id: mediumId, article });
    } else {
      const result = await this.gateway.createArticle({ article });
      const newFrontmatter = {
        [ARTICLE_ID_KEY]: result.id,
        [ARTICLE_URL_KEY]: result.url,
        [ARTICLE_CANONICAL_URL_KEY]: result.canonicalUrl,
      };
      this.updateFrontmatter(file, newFrontmatter);
    }
  }
}
