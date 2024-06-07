import { requestUrl, RequestUrlParam } from "obsidian";
type RequestUrl = typeof requestUrl;

type Article = {
  title: string;
  markdown: string;
  // eventually tags - from frontmatter
};

const bodyFromArticle = (article: Article) => ({
  article: {
    title: article.title,
    published: false,
    body_markdown: article.markdown,
    tags: [],
    series: "Hello series", // TODO, what about series?
  },
});

export const postArticle = async (
  input: { apiKey: string; article: Article },
  requestUrl: MakeHttpRequest,
) => {
  const body = bodyFromArticle(input.article);
  const response = await requestUrl({
    url: "https://dev.to/api/articles",
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "api-key": input.apiKey,
    },
    contentType: "application/json",
  });
  return response.json;
};

const putArticle = async (
  input: { articleId: number; article: Article; apiKey: string },
  requestUrl: MakeHttpRequest,
) => {
  const { articleId, article, apiKey } = input;
  const body = bodyFromArticle(article);
  const response = await requestUrl({
    url: `https://dev.to/api/articles/${articleId}`,
    method: "PUT",
    throw: false,
    body: JSON.stringify({ article: { body_markdown: article.markdown } }),
    headers: {
      "api-key": apiKey,
    },
    contentType: "application/json",
  });
  const response_body = await response.json;
};

type CreateArticleResult = {
  id: number;
  url: string;
  canonicalUrl: string;
};

export type HttpResponse = {
  json: Promise<any>;
};

export type MakeHttpRequest = (input: RequestUrlParam) => Promise<HttpResponse>;

let assertIsObject = (input: unknown): input is {} => {
  return typeof input === "object" && input !== null;
};

export default class MediumGateway {
  apiKey: string;
  requestUrl: MakeHttpRequest;

  constructor(apiKey: string, requestUrl: MakeHttpRequest) {
    this.apiKey = apiKey;
    this.requestUrl = requestUrl;
  }

  async createArticle(input: {
    article: Article;
  }): Promise<CreateArticleResult> {
    const temp: unknown = await postArticle(
      { apiKey: this.apiKey, article: input.article },
      this.requestUrl,
    );
    if (!assertIsObject(temp)) {
      throw new Error("Bad response from Medium");
    }
    if ("id" in temp && typeof temp["id"] === "number") {
      if ("url" in temp && typeof temp["url"] === "string") {
        if (
          "canonical_url" in temp &&
          typeof temp["canonical_url"] === "string"
        ) {
          const { id, url, canonical_url } = temp;
          return { id, url, canonicalUrl: canonical_url };
        }
      }
    }
    throw new Error("Bad response");
  }

  async updateArticle(input: { id: number; article: Article }) {
    return await putArticle(
      { apiKey: this.apiKey, article: input.article, articleId: input.id },
      this.requestUrl,
    );
  }
}
