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

export type JsonObject = { [key: string]: Json }
export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | JsonObject
  ;

type ReplaceInstruction = { from: number; to: number; replaceString: string };

const processInlineMathJax = (jax: string): ReplaceInstruction[] => {
  const matches = [...jax.matchAll(/\$([^$]+)\$/g)];
  return matches.map((match): (ReplaceInstruction | undefined) => {
    const matchJax = match[1]
    if (typeof match.index !== "number") { return undefined }
    return {
      from: match.index,
      to: match.index + match[0].length,
      replaceString: `{% katex inline %}\n ${matchJax}\n{% endkatex %}`
    }
  }).filter(x => typeof x !== 'undefined')
}

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

  async generateMarkdown(file: TFile) {
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
    const jaxInstructions = processInlineMathJax(originalContents)

    const dataAfterHeading = this.applyReplaceInstruction(
      [h1Instructions, replaceInstructions, jaxInstructions].flat(),
      originalContents,
    );
    const frontmatterInfo = this.getFrontMatterInfo.getFrontMatterInfo(dataAfterHeading);
    const markdown = (
      frontmatterInfo.exists
        ? dataAfterHeading.substring(frontmatterInfo.contentStart)
        : dataAfterHeading
    ).trim();
    return markdown
  }

  generateTitle(file: TFile) {
    const metadataCache = this.app.metadataCache.getFileCache(file);
    const h1 = metadataCache?.headings?.find((x) => x.level === 1);
    return h1?.heading || "Heading Missin";
  }

  async getArticleData(file: TFile) {
    const markdown = await this.generateMarkdown(file);
    const title = this.generateTitle(file);
    return {
      title,
      markdown,
    };
  }

  async updateFrontmatter(file: TFile, newData: JsonObject) {
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
