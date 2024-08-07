import sinon from "sinon";
import { FrontMatterInfo } from "obsidian";
import {
  CachedMetadata,
  GenericApp,
  GenericFileManager,
  GenericMetadataCache,
  GenericVault,
  HeadingCache,
  EmbedCache,
  LinkCache,
} from "src/interfaces";
import { GetFrontMatterInfo } from "src/obsidian-implementations";
import Publisher, { JsonObject } from "src/publisher";
import MediumGateway from "src/medium-gateway";
import { createFakeFile } from "./factories";

export type FakeFile = {
  path: string;
  frontmatter: JsonObject;
  contents: string;
};

export class FakeFileManager implements GenericFileManager<FakeFile> {
  processFrontMatter(file: FakeFile, fn: (frontmatter: JsonObject) => void) {
    fn(file.frontmatter);
    return Promise.resolve();
  }
  createFakeFile(data?: Partial<FakeFile>): FakeFile {
    return createFakeFile(data);
  }
}

export class FakeVault implements GenericVault<FakeFile> {
  async read(file: FakeFile) {
    return Promise.resolve(file.contents);
  }
}

export const getHeadings = (data: string): HeadingCache[] => {
  const pattern = /(?:^|\n)(#+) (.*)/g;
  const matches = data.matchAll(pattern);
  const headings: HeadingCache[] = [];
  for (const match of matches) {
    const index = match.index!;
    const matchedString = match[0];
    const addToOffset = matchedString.startsWith("\n") ? 1 : 0;
    const offset = index + addToOffset;
    headings.push({
      heading: match[2].trim(),
      level: match[1].length,
      position: {
        start: { offset },
        end: { offset: index + matchedString.length },
      },
    });
  }
  return headings;
};

export const getEmbeds = (data: string): EmbedCache[] => {
  const matches = [
    ...data.matchAll(/!\[{2}(?<link>[^|\]]*)(?:\|(?<displayText>.+))?\]{2}/g),
  ];
  return matches.map((match) => {
    const start = match.index;
    const end = match[0].length + start;
    const { link, displayText } = match.groups!;
    if (!displayText) {
      return {
        link: link,
        original: match[0],
        position: {
          start: { offset: start },
          end: { offset: end },
        },
      };
    } else {
      return {
        link: link,
        original: match[0],
        displayText,
        position: {
          start: { offset: start },
          end: { offset: end },
        },
      };
    }
  });
};

export const getLinks = (data: string) => {
  const links: LinkCache[] = [];

  const matches = data.matchAll(
    /[^!](?<original>\[{2}(?<link>[^\]|]+)(?:\|(?<alias>[^\]]*))?\]\])/g,
  );
  for (const match of matches) {
    const link = match.groups!.link;
    const displayText = match.groups!.alias || link;
    const original = match.groups!.original;
    const index = match.index!;
    links.push({
      link,
      displayText,
      original,
      position: {
        start: { offset: index + 1 },
        end: { offset: index + match[0].length },
      },
    });
  }
  return links;
};

export const getMetadata = (file: FakeFile): CachedMetadata => {
  const { frontmatter, contents } = file;
  const links = getLinks(contents);
  const headings = getHeadings(contents);
  const embeds = getEmbeds(contents);
  return { headings, links, frontmatter, embeds };
};

export class FakeMetadataCache implements GenericMetadataCache<FakeFile> {
  linkTargets: { link: string; path: string; resolvesTo: FakeFile }[];

  constructor() {
    this.linkTargets = [];
  }

  getFileCache(file: FakeFile) {
    return getMetadata(file);
  }

  getFirstLinkpathDest(link: string, path: string): FakeFile | null {
    const target = this.linkTargets.find(
      (x) => x.link === link && x.path === path,
    );
    return target?.resolvesTo || null;
  }

  setLinkTarget(link: string, path: string, resolvesTo: FakeFile) {
    this.linkTargets.push({ link, path, resolvesTo });
  }
}

export class FakeGetFrontMatterInfo implements GetFrontMatterInfo {
  getFrontMatterInfo(contents: string): FrontMatterInfo {
    const matches = /^---[^-]+---/.exec(contents);
    if (!matches) {
      return {
        exists: false,
        contentStart: 0,
        frontmatter: "",
        from: 0,
        to: 0,
      };
    } else {
      const frontmatterLength = matches[0].length;
      return {
        exists: true,
        contentStart: frontmatterLength,
        frontmatter: contents.substring(0, frontmatterLength),
        from: 0,
        to: frontmatterLength - 1, // ?? but we don't depend on this
      };
    }
  }
}

export class FakeApp implements GenericApp<FakeFile> {
  fileManager: FakeFileManager;
  vault: FakeVault;
  metadataCache: FakeMetadataCache;

  constructor() {
    this.fileManager = new FakeFileManager();
    this.vault = new FakeVault();
    this.metadataCache = new FakeMetadataCache();
  }
}

export const createGatewayStubWithDefaults = () => {
  const result = sinon.createStubInstance(MediumGateway);
  result.getArticleStatus.resolves({ published: false });
  return result;
};

export const createPublisher = (app: FakeApp, gateway?: MediumGateway) => {
  return new Publisher(
    app,
    gateway || createGatewayStubWithDefaults(),
    new FakeGetFrontMatterInfo(),
  );
};
