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
    const metadataCache = this.app.metadataCache.getFileCache(file);
    const h1 = metadataCache.headings?.find((x) => x.level === 1);
    const dataAfterHeading = h1
      ? fileContents.substring(h1.position.end.offset)
      : fileContents;
    const frontmatterInfo =
      await this.getFrontMatterInfo.getFrontMatterInfo(dataAfterHeading);
    const markdown = frontmatterInfo.exists
      ? dataAfterHeading.substring(frontmatterInfo.contentStart)
      : dataAfterHeading;
    const article = {
      title: h1?.heading || "Heading Missing",
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
