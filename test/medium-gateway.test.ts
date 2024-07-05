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
      fetchMock.get("https://dev.to/api/articles/1234", {
        ...exampleArticleResponse,
        url: "https://example.com/article/1234",
        canonical_url: "https://my-site.example.com/article/1234",
      });
      const gateway = new MediumGateway("API_KEY", fetchRequestUrlWrapper);
      const status = await gateway.getArticleStatus({ id: 1234 });
      expect(status).to.be.like({
        published: true,
        url: "https://example.com/article/1234",
        canonicalUrl: "https://my-site.example.com/article/1234",
      });
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
  url: "https://dev.to/stroiman/introducing-speed-2ofk",
  comments_count: 0,
  public_reactions_count: 1,
  collection_id: 27578,
  published_timestamp: "2024-06-03T15:58:05Z",
  positive_reactions_count: 1,
  cover_image: null,
  social_image:
    "https://media.dev.to/cdn-cgi/image/width=1000,height=500,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Ff9tcvfiwlb62jmjcbja7.png",
  canonical_url: "https://dev.to/stroiman/introducing-speed-2ofk",
  user: {
    name: "Peter",
    username: "stroiman",
    user_id: 12345,
  },
};
