import type { requestUrl } from "obsidian";
type RequestUrl = typeof requestUrl;

type Article = {
  title: string;
  markdown: string;
  // eventually tags - from frontmatter
};

export const postArticle = async (
  input: { apiKey: string; article: Article },
  requestUrl: RequestUrl,
) => {
  const body = {
    article: {
      title: input.article.title,
      published: false,
      body_markdown: input.article.markdown,
      tags: [],
      series: "Hello series", // TODO, what about series?
    },
  };
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

type CreateArticleResult = {
  id: number;
};

export default class MediumGateway {
  async createArticle(input: {
    article: Article;
  }): Promise<CreateArticleResult> {
    throw new Error("Not implemented yet");
  }
  async updateArticle(input: { id: number; article: Article }) {
    throw new Error("Not implemented yet");
  }
}
