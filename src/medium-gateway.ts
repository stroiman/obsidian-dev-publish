import { RequestUrlParam } from "obsidian";
import { Json } from "./publisher";
import { isNumber, isObject, isString } from "./validation";

export type Article = {
  title: string;
  markdown: string;
  tags?: string[];
  series?: string;
  // eventually tags - from frontmatter
};

type ArticleStatusPublished = {
  published: true;
  url: string;
  canonicalUrl: string;
};

type ArticleStatusUnpublished = {
  published: false;
};

export type ArticleStatus = ArticleStatusPublished | ArticleStatusUnpublished;

const bodyFromArticle = ({ markdown, ...rest }: Article) => ({
  article: {
    body_markdown: markdown,
    ...rest,
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
  console.log("Update dev article", { articleId, body });
  await requestUrl({
    url: `https://dev.to/api/articles/${articleId}`,
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      "api-key": apiKey,
    },
    contentType: "application/json",
  });
};

export type CreateArticleResult = {
  id: number;
  url: string;
  canonicalUrl: string;
};

export type HttpResponse = {
  status: number;
  json: Promise<Json>;
};

export type MakeHttpRequest = (input: RequestUrlParam) => Promise<HttpResponse>;

const verifyArticle = (data: unknown) => {
  return isObject(data, {
    id: isNumber,
    url: isString,
    canonical_url: isString,
  });
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
    if (!verifyArticle(temp)) {
      throw new Error("Bad response");
    }
    const { id, url, canonical_url } = temp;
    return { id, url, canonicalUrl: canonical_url };
  }

  async updateArticle(input: { id: number; article: Article }) {
    return await putArticle(
      { apiKey: this.apiKey, article: input.article, articleId: input.id },
      this.requestUrl,
    );
  }

  async getArticleStatus(input: { id: number }): Promise<ArticleStatus> {
    const params: RequestUrlParam = {
      url: `https://dev.to/api/articles/${input.id}`,
      throw: false,
    };
    const response = await this.requestUrl(params);
    switch (response.status) {
      case 404:
        return { published: false };
      case 200: {
        const data = await response.json;
        if (!(data && typeof data === "object" && "published_at" in data)) {
          throw new Error(
            "Unexpected response from DEV. Please file an issue, and attach the console logs (check if they contain any sensitive information data first)",
          );
        }
        if (!verifyArticle(data)) {
          throw new Error("Bad data retrieved from server");
        }
        return {
          published: true,
          url: data.url,
          canonicalUrl: data.canonical_url,
        };
      }
      default:
        throw new Error("Unexpected status");
    }
  }
}
