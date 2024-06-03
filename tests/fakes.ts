import { GenericFileManager } from "src/interfaces";

export type FakeFile = { frontmatter: any };

export class FakeFileManager implements GenericFileManager<FakeFile> {
  processFrontMatter(file: FakeFile, fn: (frontmatter: any) => void) {
    fn(file.frontmatter);
    return Promise.resolve();
  }
}
