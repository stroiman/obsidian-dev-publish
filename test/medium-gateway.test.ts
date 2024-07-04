import { expect } from "chai";
import fetchMock from "fetch-mock";
import MediumGateway from "src/medium-gateway";
import { fetchRequestUrlWrapper } from "./obsidian-wrappers";

describe("MediumGateway", () => {
  afterEach(() => {
    fetchMock.restore();
  });

  describe("getArticleStatus", () => {
    it("Should return `not-published` when server responds with a 404", async () => {
      fetchMock.get("https://dev.to/api/articles/1234", 404);
      const gateway = new MediumGateway("API_KEY", fetchRequestUrlWrapper);
      const result = await gateway.getArticleStatus({ id: 1234 });
      expect(result.published).to.be.false;
    });

    it("Should return `published` when a published article is returned", async () => {
      fetchMock.get("https://dev.to/api/articles/1234", exampleArticleResponse);
      const gateway = new MediumGateway("API_KEY", fetchRequestUrlWrapper);
      const status = await gateway.getArticleStatus({ id: 1234 });
      expect(status.published).to.be.true;
    });

    it("Should throw an error if the article has no `published_at` property", async () => {
      const response = { ...exampleArticleResponse };
      delete (response as any).published_at;
      fetchMock.get("https://dev.to/api/articles/1234", response);
      const gateway = new MediumGateway("API_KEY", fetchRequestUrlWrapper);
      await gateway.getArticleStatus({ id: 1234 }).should.be.rejected;
    });
  });
});

const exampleArticleResponse = {
  id: 1234,
  type_of: "article",
  title: "My great article",
  published_at: new Date().toISOString(),
  tags: ["tag1", "tag2"],
  body_html: "<h2>Hello world</h2>",
  user: {
    name: "John",
    username: "j",
    user_id: 12345,
  },
};
