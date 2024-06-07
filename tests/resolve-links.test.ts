import sinon, { match } from "sinon";
import MediumGateway from "src/medium-gateway";
import Publisher from "src/publisher";
import { createPublisher, FakeApp } from "./fakes";

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

  const gateway = sinon.createStubInstance(MediumGateway);
  const publisher = createPublisher(fakeApp, gateway);
  await publisher.publish(fileToPublish);
  gateway.updateArticle.should.have.been.calledOnce;
  const data = gateway.updateArticle.firstCall.args[0];
  data.article.markdown.should.equal(
    "Line1: [File1](https://example.com/file1)\nLine2: File2\nLine3: File3",
  );
});
