import sinon, { match } from "sinon";
import { GenericFileManager } from "src/interfaces";
import MediumGateway from "src/medium-gateway";
import Publisher from "src/publisher";
import { createFakeFile } from "./factories";
import {
  FakeFile,
  FakeFileManager,
  FakeGetFrontMatterInfo,
  FakeVault,
} from "./fakes";
import fetchMock from "fetch-mock";
import { fetchRequestUrlWrapper } from "./obsidian-wrappers";

describe.only("Update the url and canonical-url in frontmatter", () => {
  let publisher: Publisher<FakeFile>;
  let fileManager: FakeFileManager;

  beforeEach(() => {
    fileManager = new FakeFileManager();
    const gateway = new MediumGateway("API_KEY", fetchRequestUrlWrapper);
    publisher = new Publisher(
      fileManager,
      gateway,
      new FakeVault(),
      new FakeGetFrontMatterInfo(),
    );
  });

  afterEach(() => {
    fetchMock.reset();
  });

  it("Should set a URL after creating a new article", async () => {
    const file = fileManager.createFakeFile();
    fetchMock.post("https://dev.to/api/articles", {
      id: 1234,
      url: "https://dev.to/exaple/hello-world-123-temp-slug-123",
      canonical_url: "https://example.com/articles/hello-world",
    });
    await publisher.publish(file);
    file.frontmatter.should.be.like({
      "dev-article-id": 1234,
      "dev-url": "https://dev.to/exaple/hello-world-123-temp-slug-123",
      "dev-canonical-url": "https://example.com/articles/hello-world",
    });
  });
});
