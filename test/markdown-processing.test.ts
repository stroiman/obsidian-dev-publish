import { expect } from "chai";
import {
  createGatewayStubWithDefaults,
  createPublisher,
  FakeApp,
  FakeFile,
} from "./fakes";
import Publisher from "src/publisher";

describe("Mathjax resolution", () => {
  let fakeApp: FakeApp;
  let file: FakeFile;
  let publisher: Publisher<FakeFile>;

  beforeEach(() => {
    fakeApp = new FakeApp();
    file = fakeApp.fileManager.createFakeFile({});
    publisher = createPublisher(fakeApp);
  });

  describe("The file does not have the `dev-enable-mathjax` property", () => {
    beforeEach(() => {
      delete file.frontmatter["dev-enable-mathjax"];
    });

    it("Should ignore `$`s, even when valid mathjax is contained", async () => {
      // Stupidly replacing every text between two $ characters would mess up a
      // lot of valid cases for having $ in the text.
      file.contents =
        "A paragraph with inline mathjax $c = \\pm\\sqrt{a^2 + b^2}$.";
      const markdown = await publisher.generateMarkdown(file);
      expect(markdown).to.equal(file.contents);
    });
  });

  describe("The file has the `dev-enable-mathjax` metadata", () => {
    beforeEach(() => {
      file.frontmatter["dev-enable-mathjax"] = true;
    });

    it("Should ignore `$` when they are not on the same line", async () => {
      // Stupidly replacing every text between two $ characters would mess up a
      // lot of valid cases for having $ in the text.
      const contents = `Income: 120$

Expenses: 80$

Profit: 40$`;
      file.contents = contents;
      const markdown = await publisher.generateMarkdown(file);
      expect(markdown).to.equal(file.contents);
    });

    it("Processes inline mathjax to inline mathjax liquid", async () => {
      const contents = `A paragraph

Our $CO_2$ reporting!

A paragraph with inline mathjax $c = \\pm\\sqrt{a^2 + b^2}$ showing.

$$
c = \\pm\\sqrt{a^2 + b^2}
$$`;
      file.contents = contents;
      const markdown = await publisher.generateMarkdown(file);
      expect(markdown).to.equal(`A paragraph

Our {% katex inline %}
 CO_2
{% endkatex %} reporting!

A paragraph with inline mathjax {% katex inline %}
 c = \\pm\\sqrt{a^2 + b^2}
{% endkatex %} showing.

{% katex %}
c = \\pm\\sqrt{a^2 + b^2}
{% endkatex %}`);
    });

    it.skip("Ignores non-matching end $s", async () => {
      file.contents = `A paragraph $$CO_2$`;
      const markdown = await publisher.generateMarkdown(file);
      expect(markdown).to.equal(`A paragraph $$CO_2$`);
    });
  });
});

describe("Link resolution", () => {
  it("Should replace valid medialinks with URLs", async () => {
    const fakeApp = new FakeApp();
    const fileToPublish = fakeApp.fileManager.createFakeFile({
      frontmatter: { "dev-article-id": 42 },
    });
    const path = fileToPublish.path;
    const file1 = fakeApp.fileManager.createFakeFile({
      frontmatter: {
        url: "https://example.com/file1",
      },
    });
    const file2 = fakeApp.fileManager.createFakeFile();
    fakeApp.metadataCache.setLinkTarget("File1", path, file1);
    fakeApp.metadataCache.setLinkTarget("File2", path, file2);
    fileToPublish.contents = `Line1: [[File1]]\nLine2: [[File2]]\nLine3: [[File3]]`;

    const gateway = createGatewayStubWithDefaults();
    const publisher = createPublisher(fakeApp, gateway);
    await publisher.publish(fileToPublish);
    gateway.updateArticle.should.have.been.calledOnce;
    const data = gateway.updateArticle.firstCall.args[0];
    data.article.markdown.should.equal(
      "Line1: [File1](https://example.com/file1)\nLine2: File2\nLine3: File3",
    );
  });

  it("Should play nice with title replacement", async () => {
    const fakeApp = new FakeApp();
    const fileToPublish = fakeApp.fileManager.createFakeFile({
      frontmatter: { "dev-article-id": 42 },
    });
    fileToPublish.contents = `Line1: [[File1]]\n\n# Heading\n\nLine2: [[File2]]\nLine3: [[File3]]`;

    const gateway = createGatewayStubWithDefaults();
    const publisher = createPublisher(fakeApp, gateway);
    await publisher.publish(fileToPublish);
    gateway.updateArticle.should.have.been.calledOnce;
    const data = gateway.updateArticle.firstCall.args[0];
    data.article.markdown.should.equal("Line2: File2\nLine3: File3");
  });
});

describe("Image resolution", () => {
  it("Maps mapped a mapped image to markdown image link", async () => {
    const fakeApp = new FakeApp();
    const gateway = createGatewayStubWithDefaults();
    const publisher = createPublisher(fakeApp, gateway);
    const file = fakeApp.fileManager.createFakeFile({
      contents: "A file with ![[embedded-image.png|an embedded image]] in it",
      frontmatter: {
        "dev-article-id": 42,
        "dev-image-map": [
          {
            imageFile: "[[embedded-image.png]]",
            publicUrl: "https://example.com/image.png",
          },
        ],
      },
    });
    await publisher.publish(file);
    gateway.updateArticle.should.have.been.calledOnce;
    const data = gateway.updateArticle.firstCall.args[0];
    data.article.markdown.should.equal(
      "A file with ![an embedded image](https://example.com/image.png) in it",
    );
  });
});
