import sinon, { match } from "sinon";
import MediumGateway, { CreateArticleResult } from "src/medium-gateway";
import Publisher from "src/publisher";
import { createFakeFile } from "./factories";
import { FakeApp, FakeFile, FakeGetFrontMatterInfo } from "./fakes";
import { expect } from "chai";

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
      expect(obsidianFile.frontmatter["dev-article-id"]).to.equal(43);
    });

    describe("Series", () => {
      it("Should not be included in the posted data if the `dev-series` metadata doesn't exist", async () => {
        // This is already the default state, but I want the test to make this explicit
        delete obsidianFile.frontmatter["dev-series"];
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledWith(
          match({ article: { series: match.typeOf("undefined") } }),
        );
      });

      it("Should be set in the data if the `dev-series` metadata has a string value", async () => {
        // This is already the default state, but I want the test to make this explicit
        obsidianFile.frontmatter["dev-series"] = "My awesome series";
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledWith(
          match({
            article: { series: "My awesome series" },
          }),
        );
      });

      it("Should be ignored data if the `dev-series` metadata is not a string", async () => {
        // This is already the default state, but I want the test to make this explicit
        obsidianFile.frontmatter["dev-series"] = 42;
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledWith(
          match({ article: { series: match.typeOf("undefined") } }),
        );
      });
    });

    describe("Publishing tags", () => {
      it("Should not create `tags` if none exists in frontmatter", async () => {
        // This is already the default state, but I want the test to make this explicit
        delete obsidianFile.frontmatter["dev-tags"];
        await publisher.publish(obsidianFile);
        const article = gateway.createArticle.firstCall.args[0];
        article.should.not.haveOwnProperty("tags");
      });

      it("Should create `tags` if they exists in frontmatter", async () => {
        // This is already the default state, but I want the test to make this explicit
        obsidianFile.frontmatter["dev-tags"] = ["tag1", "tag2"];
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: { tags: ["tag1", "tag2"] },
          }),
        );
      });

      it("Should ignore tags if not an array", async () => {
        obsidianFile.frontmatter["dev-tags"] = 42;
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: { tags: undefined },
          }),
        );
      });

      it("Should filter out tags that are not strings", async () => {
        obsidianFile.frontmatter["dev-tags"] = ["foo", {}, "bar"];
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: { tags: ["foo", "bar"] },
          }),
        );
      });

      it("Should truncate if there are more than 4 tags", async () => {
        obsidianFile.frontmatter["dev-tags"] = [
          "Tag-1",
          "Tag-2",
          "Tag-3",
          "Tag-4",
          "Tag-5",
          "Tag-6",
        ];
        await publisher.publish(obsidianFile);
        gateway.createArticle.should.have.been.calledOnceWith(
          match({
            article: { tags: ["Tag-1", "Tag-2", "Tag-3", "Tag-4"] },
          }),
        );
      });
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
