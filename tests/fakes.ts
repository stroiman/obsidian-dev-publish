import { FrontMatterInfo, MetadataCache } from "obsidian";
import {
  CachedMetadata,
  GenericApp,
  GenericFileManager,
  GenericMetadataCache,
  GenericVault,
  HeadingCache,
} from "src/interfaces";
import { GetFrontMatterInfo } from "src/obsidian-implementations";

export type FakeFile = {
  frontmatter: any;
  contents: string;
};

export class FakeFileManager implements GenericFileManager<FakeFile> {
  processFrontMatter(file: FakeFile, fn: (frontmatter: any) => void) {
    fn(file.frontmatter);
    return Promise.resolve();
  }
  createFakeFile() {
    return {
      frontmatter: {},
      contents: "",
    };
  }
}

export class FakeVault implements GenericVault<FakeFile> {
  async read(file: FakeFile) {
    return Promise.resolve(file.contents);
  }
}

export const getMetadata = (data: string): CachedMetadata => {
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
  return { headings };
};

export class FakeMetadataCache implements GenericMetadataCache<FakeFile> {
  getFileCache(file: FakeFile) {
    return getMetadata(file.contents);
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
