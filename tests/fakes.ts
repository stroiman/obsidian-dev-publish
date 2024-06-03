import { FrontMatterInfo } from "obsidian";
import { GenericFileManager, GenericVault } from "src/interfaces";
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
}

export class FakeVault implements GenericVault<FakeFile> {
  async read(file: FakeFile) {
    return Promise.resolve(file.contents);
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
