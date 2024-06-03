import sinon, { match } from "sinon";
import { GenericFileManager } from "src/interfaces";
import MediumGateway from "src/medium-gateway";
import Publisher from "src/publisher";
import { createFakeFile } from "./factories";
import { FakeFile, FakeFileManager, FakeVault } from "./fakes";

describe("Publish a file from a TFile structure", () => {
  let gateway: sinon.SinonStubbedInstance<MediumGateway>;
  let publisher: Publisher<FakeFile>;

  beforeEach(() => {
    gateway = sinon.createStubInstance(MediumGateway);
    publisher = new Publisher(new FakeFileManager(), gateway, new FakeVault());
  });

  it("Should _update_ if the file has already been published", async () => {
    const obsidianFile = createFakeFile({
      frontmatter: { "medium-article-id": 42 },
    });
    await publisher.publish(obsidianFile);
    gateway.updateArticle.should.have.been.calledOnceWith(
      match({
        id: 42,
      }),
    );
  });

  describe("The file has not been published", () => {
    let obsidianFile: FakeFile;

    beforeEach(() => {
      gateway.createArticle.resolves({ id: 43 });
      obsidianFile = createFakeFile({
        frontmatter: {},
      });
    });

    it("Should create an article", async () => {
      await publisher.publish(obsidianFile);
      gateway.createArticle.should.have.been.calledOnce;
    });

    it("Should update the frontmatter", async () => {
      await publisher.publish(obsidianFile);
      obsidianFile.frontmatter["medium-article-id"].should.equal(43);
    });

    describe("Contents does not containt frontmatter", () => {
      beforeEach(() => {
        obsidianFile.contents = "# Heading\n\n Foo bar";
      });

      it("Should publish the entire file contents", async () => {
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: {
              markdown: "# Heading\n\n Foo bar",
            },
          }),
        );
      });
    });
  });
});
