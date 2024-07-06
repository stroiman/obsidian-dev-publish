import {
  CachedMetadata,
  GenericApp,
  GenericFileManager,
  GenericVault,
  GetFrontMatterInfo,
} from "./interfaces";
import MediumGateway, { Article } from "./medium-gateway";
import type { DialogController } from "./image-mapping-dialog";
import { isArray, isObject, isString } from "./validation";

const ARTICLE_ID_KEY = "dev-article-id";
const ARTICLE_URL_KEY = "dev-url";
const ARTICLE_CANONICAL_URL_KEY = "dev-canonical-url";
const ARTICLE_IMAGE_MAP_KEY = "dev-image-map";
const ARTICLE_PUBLISHED = "dev-published";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heif"];

export type JsonObject = { [key: string]: Json };
export type Json = string | number | boolean | null | Json[] | JsonObject;

type ReplaceInstruction = { from: number; to: number; replaceString: string };

const isImageMap = (input: unknown) =>
  isObject(input, {
    publicUrl: isString,
    imageFile: isString,
  });
const isMapping = (input: unknown) => isArray(input, isImageMap);

const processInlineMathJax = (jax: string): ReplaceInstruction[] => {
  const matches = [...jax.matchAll(/(\${1})([^\n$]+)\1/g)];
  return matches
    .map((match): ReplaceInstruction | undefined => {
      const matchJax = match[2];
      if (typeof match.index !== "number") {
        return undefined;
      }
      return {
        from: match.index,
        to: match.index + match[0].length,
        replaceString: `{% katex inline %}\n ${matchJax}\n{% endkatex %}`,
      };
    })
    .filter((x) => typeof x !== "undefined");
};

const processBlockMathJax = (jax: string): ReplaceInstruction[] => {
  const matches = [...jax.matchAll(/(\${2})([^$]+)\1/g)];
  return matches
    .map((match): ReplaceInstruction | undefined => {
      const matchJax = match[2];
      if (typeof match.index !== "number") {
        return undefined;
      }
      return {
        from: match.index,
        to: match.index + match[0].length,
        replaceString: `{% katex %}\n${matchJax.trim()}\n{% endkatex %}`,
      };
    })
    .filter((x) => typeof x !== "undefined");
};

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
    return this.app.metadataCache.getFileCache(file)?.frontmatter;
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
        const frontmatter = targetFile && this.getFrontMatter(targetFile);
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

  processImages(_file: TFile, md: CachedMetadata | null): ReplaceInstruction[] {
    if (!md?.embeds) {
      return [];
    }
    const frontmatter = md.frontmatter;
    const imageMap = frontmatter && frontmatter[ARTICLE_IMAGE_MAP_KEY];
    const getExistingMap = (file: string) => {
      return (
        isMapping(imageMap) &&
        imageMap.find((x) => x.imageFile === `[[${file}]]`)?.publicUrl
      );
    };

    return md.embeds.flatMap((embed): ReplaceInstruction[] => {
      const publicUrl = getExistingMap(embed.link);
      const displayText = embed.displayText || embed.link;
      const { start, end } = embed.position;
      return publicUrl
        ? [
            {
              replaceString: `![${displayText}](${publicUrl})`,
              from: start.offset,
              to: end.offset,
            },
          ]
        : [];
    });
  }

  async generateMarkdown(file: TFile) {
    const originalContents = await this.vault.read(file);
    const metadataCache = this.app.metadataCache.getFileCache(file);
    const frontmatter = metadataCache?.frontmatter || {};
    const markdownLinkReplaceInstructions = await this.processLinks(
      file,
      metadataCache,
    );
    const imageEmbedsReplaceInstructions = this.processImages(
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

    if (frontmatter["dev-enable-mathjax"]) {
      markdownLinkReplaceInstructions.splice(
        markdownLinkReplaceInstructions.length,
        0,
        ...processInlineMathJax(originalContents),
      );
      markdownLinkReplaceInstructions.splice(
        markdownLinkReplaceInstructions.length,
        0,
        ...processBlockMathJax(originalContents),
      );
    }

    const dataAfterHeading = this.applyReplaceInstruction(
      [
        h1Instructions,
        markdownLinkReplaceInstructions,
        imageEmbedsReplaceInstructions,
      ].flat(),
      originalContents,
    );
    const frontmatterInfo =
      this.getFrontMatterInfo.getFrontMatterInfo(dataAfterHeading);
    const markdown = (
      frontmatterInfo.exists
        ? dataAfterHeading.substring(frontmatterInfo.contentStart)
        : dataAfterHeading
    ).trim();
    return markdown;
  }

  generateTitle(file: TFile) {
    const metadataCache = this.app.metadataCache.getFileCache(file);
    const h1 = metadataCache?.headings?.find((x) => x.level === 1);
    return h1?.heading || "Heading Missing";
  }

  async getArticleData(file: TFile): Promise<Article> {
    const parseTags = (tags: Json | undefined) => {
      if (!Array.isArray(tags)) {
        return undefined;
      }
      return tags.filter((x) => typeof x === "string").slice(0, 4);
    };
    const parseString = (value: Json | undefined) => {
      if (typeof value === "string") {
        return value;
      }
      return undefined;
    };
    const metadataCache = this.app.metadataCache.getFileCache(file);
    const markdown = await this.generateMarkdown(file);
    const title = this.generateTitle(file);
    const tags = parseTags(metadataCache?.frontmatter?.["dev-tags"]);
    const series = parseString(metadataCache?.frontmatter?.["dev-series"]);

    return {
      title,
      markdown,
      tags,
      series,
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
      await this.updateStatus(file);
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

  async updateStatus(file: TFile) {
    // Get status from DEV, and update URLs
    const frontmatter = this.getFrontMatter(file);
    const id: any = frontmatter && frontmatter[ARTICLE_ID_KEY];
    if (typeof id === "number") {
      const status = await this.gateway.getArticleStatus({ id });
      await this.fileManager.processFrontMatter(file, (fm) => {
        fm[ARTICLE_PUBLISHED] = status.published;
        if (status.published) {
          fm[ARTICLE_URL_KEY] = status.url;
          fm[ARTICLE_CANONICAL_URL_KEY] = status.canonicalUrl;
        }
      });
    }
  }

  async mapImages(file: TFile, dialogController: DialogController) {
    const md = this.app.metadataCache.getFileCache(file);
    if (!md) {
      return;
    }
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    const imageMap = frontmatter && frontmatter[ARTICLE_IMAGE_MAP_KEY];
    const getExistingMap = (file: string) => {
      return (
        isMapping(imageMap) &&
        imageMap.find((x) => x.imageFile === `[[${file}]]`)?.publicUrl
      );
    };

    const getExtension = (link: string) => {
      const index = link.lastIndexOf(".");
      return index === -1 ? "" : link.substring(index);
    };
    const list =
      md.embeds
        ?.map((x) => ({
          imageFile: x.link,
          publicUrl: getExistingMap(x.link) || "",
        }))
        .filter(({ imageFile }) =>
          IMAGE_EXTENSIONS.includes(getExtension(imageFile)),
        ) || [];

    const result = await dialogController.showImageMappingDialog(list);
    if (result) {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        fm[ARTICLE_IMAGE_MAP_KEY] =
          result &&
          result
            .map((x) => ({ ...x, imageFile: `[[${x.imageFile}]]` }))
            .filter((x) => x.publicUrl);
      });
    }
  }
}
