import sinon, { match } from "sinon";
import { GenericFileManager } from "src/interfaces";
import MediumGateway from "src/medium-gateway";
import Publisher from "src/publisher";
import { createFakeFile } from "./factories";
import {
  FakeApp,
  FakeFile,
  FakeFileManager,
  FakeGetFrontMatterInfo,
  FakeVault,
} from "./fakes";
import fetchMock from "fetch-mock";
import { fetchRequestUrlWrapper } from "./obsidian-wrappers";

describe("Update the url and canonical-url in frontmatter", () => {
  let publisher: Publisher<FakeFile>;
  let fileManager: FakeFileManager;

  beforeEach(() => {
    const app = new FakeApp();
    fileManager = app.fileManager;
    const gateway = new MediumGateway("API_KEY", fetchRequestUrlWrapper);
    publisher = new Publisher(app, gateway, new FakeGetFrontMatterInfo());
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

  it("Should update the URL after an update");
  it("Should update the URL after an sync?");
});
