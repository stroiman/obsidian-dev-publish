import sinon, { match } from "sinon";
import { GenericFileManager } from "src/interfaces";
import MediumGateway from "src/medium-gateway";
import Publisher from "src/publisher";
import { createFakeFile } from "./factories";
import { FakeFile, FakeFileManager } from "./fakes";

describe("Publish a file from a TFile structure", () => {
  let gateway: sinon.SinonStubbedInstance<MediumGateway>;
  let publisher: Publisher<FakeFile>;

  beforeEach(() => {
    gateway = sinon.createStubInstance(MediumGateway);
    publisher = new Publisher(new FakeFileManager(), gateway);
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

  it("Should _create_ if the file has not been published", async () => {
    gateway.createArticle.resolves({ id: 43 });
    const obsidianFile = createFakeFile({
      frontmatter: {},
    });
    await publisher.publish(obsidianFile);
    gateway.createArticle.should.have.been.calledOnce;
    obsidianFile.frontmatter["medium-article-id"].should.equal(43);
  });
});
