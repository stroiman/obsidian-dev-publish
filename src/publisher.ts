import {
  CachedMetadata,
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

export default class Publisher<TFile extends { path: string }> {
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

  applyReplaceInstruction(
    replaceInstructions: { from: number; to: number; replaceString: string }[],
    contents: string,
  ) {
    const flattened = replaceInstructions.filter(
      (x) => !replaceInstructions.find((y) => x.from > y.from && x.to < y.to),
    );

    const result = flattened.reduce(
      (prev, curr) => {
        const toKeep = contents.substring(prev.lastIndex, curr.from);
        return {
          result: [...prev.result, toKeep, curr.replaceString],
          lastIndex: curr.to,
        };
      },
      { result: [], lastIndex: 0 },
    );
    const finalResult = [
      ...result.result,
      contents.substring(result.lastIndex),
    ].join("");
    return finalResult;
  }

  async processLinks(
    file: TFile,
    contents: string,
    cachedMetadata: CachedMetadata | null,
  ) {
    const links = cachedMetadata?.links;
    if (!links) {
      return [];
    }
    const tmp = await Promise.all(
      links.map(async (link) => {
        const targetFile = this.app.metadataCache.getFirstLinkpathDest(
          link.link,
          file.path,
        );
        const frontmatter =
          targetFile && (await this.getFrontMatter(targetFile));
        const url = frontmatter?.url;
        const replaceString = url
          ? `[${link.displayText}](${url})`
          : link.displayText;
        return [
          {
            from: link.position.start.offset,
            to: link.position.end.offset,
            replaceString,
          },
        ];
        return [];
      }),
    );
    return tmp.flat();
  }

  async getArticleData(file: TFile) {
    const originalContents = await this.vault.read(file);
    const metadataCache = this.app.metadataCache.getFileCache(file);
    const replaceInstructions = await this.processLinks(
      file,
      originalContents,
      metadataCache,
    );
    const h1 = metadataCache?.headings?.find((x) => x.level === 1);
    const h1Instructions = h1
      ? [
          {
            from: 0,
            to: h1.position.end.offset,
            replaceString: "",
          },
        ]
      : [];

    const dataAfterHeading = await this.applyReplaceInstruction(
      [h1Instructions, replaceInstructions].flat(),
      originalContents,
    );
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
