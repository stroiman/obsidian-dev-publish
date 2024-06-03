import sinon, { match } from "sinon";
import { GenericFileManager } from "src/interfaces";
import MediumGateway from "src/medium-gateway";
import Publisher from "src/publisher";

type DummyFile = { frontmatter: any };

class FileManager implements GenericFileManager<DummyFile> {
  processFrontMatter(file: DummyFile, fn: (frontmatter: any) => void) {
    fn(file.frontmatter);
    return Promise.resolve();
  }
}

const getFrontMatterFromFile = async (file: DummyFile) => {
  // This should eventually plugin to Obsidian's API
  return Promise.resolve(file.frontmatter);
};

const createTestTFile = (input?: Partial<DummyFile>): DummyFile => ({
  frontmatter: {},
  ...input,
});

describe("Publish a file from a TFile structure", () => {
  // The TFile is what I have as an abstraction in Obsidian for the currently
  // opened file
  it("Should _update_ if the file has already been published", async () => {
    const gateway = sinon.createStubInstance(MediumGateway);
    const publisher = new Publisher(new FileManager(), gateway);

    const obsidianFile = createTestTFile({
      frontmatter: { "medium-article-id": 42 },
    });
    await publisher.publish(obsidianFile);
    gateway.updateArticle.should.have.been.calledOnceWith(
      match({
        id: 42,
      }),
    );
  });

  it("Should _create_ if the file has not been published", async () => {
    const gateway = sinon.createStubInstance(MediumGateway);
    gateway.createArticle.resolves({ id: 43 });
    const publisher = new Publisher(new FileManager(), gateway);

    const obsidianFile = createTestTFile({
      frontmatter: {},
    });
    await publisher.publish(obsidianFile);
    gateway.createArticle.should.have.been.calledOnce;
    obsidianFile.frontmatter["medium-article-id"].should.equal(43);
  });
});
