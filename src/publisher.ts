import {
  CachedMetadata,
  GenericApp,
  GenericFileManager,
  GenericVault,
  GetFrontMatterInfo,
} from "./interfaces";
import MediumGateway from "./medium-gateway";

const ARTICLE_ID_KEY = "dev-article-id";
const ARTICLE_URL_KEY = "dev-url";
const ARTICLE_CANONICAL_URL_KEY = "dev-canonical-url";

type ReplaceInstruction = { from: number; to: number; replaceString: string };

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

  getFrontMatter(file: TFile) {
    return this.app.metadataCache.getFileCache(file)?.frontmatter
  }

  applyReplaceInstruction(
    replaceInstructions: ReplaceInstruction[],
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
    cachedMetadata: CachedMetadata | null,
  ): Promise<ReplaceInstruction[]> {
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
        const frontmatter = targetFile && (this.getFrontMatter(targetFile));
        const url = frontmatter?.url;
        const displayText = link.displayText || link.link;
        const replaceString = url ? `[${displayText}](${url})` : displayText;
        return [
          {
            from: link.position.start.offset,
            to: link.position.end.offset,
            replaceString,
          },
        ];
      }),
    );
    return tmp.flat();
  }

  async getArticleData(file: TFile) {
    const originalContents = await this.vault.read(file);
    const metadataCache = this.app.metadataCache.getFileCache(file);
    const replaceInstructions = await this.processLinks(
      file,
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

    const dataAfterHeading = this.applyReplaceInstruction(
      [h1Instructions, replaceInstructions].flat(),
      originalContents,
    );
    const frontmatterInfo = this.getFrontMatterInfo.getFrontMatterInfo(dataAfterHeading);
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
    const frontmatter = this.getFrontMatter(file);
    const mediumId = frontmatter && frontmatter[ARTICLE_ID_KEY];
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
