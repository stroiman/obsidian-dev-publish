import sinon, { match } from "sinon";
import MediumGateway, { CreateArticleResult } from "src/medium-gateway";
import Publisher from "src/publisher";
import { createFakeFile } from "./factories";
import {
  FakeApp,
  FakeFile,
  FakeGetFrontMatterInfo,
} from "./fakes";

const createPostArticleResponse = (input?: Partial<CreateArticleResult>) => ({
  id: 1,
  url: "",
  canonicalUrl: "",
  ...input,
});

describe("Publish a file from a TFile structure", () => {
  let gateway: sinon.SinonStubbedInstance<MediumGateway>;
  let publisher: Publisher<FakeFile>;

  beforeEach(() => {
    gateway = sinon.createStubInstance(MediumGateway);
    publisher = new Publisher(
      new FakeApp(),
      gateway,
      new FakeGetFrontMatterInfo(),
    );
  });

  it("Should _update_ if the file has already been published", async () => {
    const obsidianFile = createFakeFile({
      frontmatter: { "dev-article-id": 42 },
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
      gateway.createArticle.resolves(createPostArticleResponse({ id: 43 }));
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
      obsidianFile.frontmatter["dev-article-id"].should.equal(43);
    });

    describe("Contents does not contains frontmatter", () => {
      beforeEach(() => {
        obsidianFile.contents = "# Heading\n\n Foo bar";
      });

      it("Should publish contents after the H1", async () => {
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: {
              title: "Heading",
              markdown: "Foo bar",
            },
          }),
        );
      });
    });

    describe("Contents contain frontmatter but no heading", () => {
      beforeEach(() => {
        obsidianFile.contents = "---\nfoo: Bar\n---\nFoo bar";
      });

      it("Should publish the entire file contents", async () => {
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: {
              markdown: "Foo bar",
            },
          }),
        );
      });
    });
  });
});
