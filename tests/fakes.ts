import { GenericFileManager, GenericVault } from "src/interfaces";

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
