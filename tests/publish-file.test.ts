import sinon, { match } from "sinon";
import MediumGateway from "src/medium-gateway";

type DummyFile = { frontmatter: any };

interface GenericFileManager<TFile> {
  processFrontMatter(
    file: TFile,
    fn: (frontmatter: any) => void,
  ): Promise<void>;
}

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

class Publisher<TFile> {
  fileManager: GenericFileManager<TFile>;
  gateway: MediumGateway;
  constructor(fileManager: GenericFileManager<TFile>, gateway: MediumGateway) {
    this.fileManager = fileManager;
    this.gateway = gateway;
  }

  async publish(file: TFile) {
    const mediumId = await new Promise((resolve, reject) =>
      this.fileManager
        .processFrontMatter(file, (frontmatter) => {
          const mediumId = frontmatter["medium-article-id"];
          // TODO: What if it's not a number?
          resolve(mediumId);
        })
        .catch((err) => reject(err)),
    );
    if (typeof mediumId === "number") {
      await this.gateway.updateArticle({ id: mediumId });
    } else {
      const result = await this.gateway.createArticle();
      this.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter["medium-article-id"] = result.id;
      });
    }
  }
}

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
