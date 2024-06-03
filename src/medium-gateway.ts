import { requestUrl } from "obsidian";
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
  requestUrl: RequestUrl,
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
  requestUrl: RequestUrl,
) => {
  const { articleId, article, apiKey } = input;
  const body = bodyFromArticle(article);
  const response = await requestUrl({
    url: `https://dev.to/api/articles/${articleId}`,
    method: "PUT",
    throw: false,
    body: JSON.stringify(body),
    headers: {
      "api-key": apiKey,
    },
    contentType: "application/json",
  });
  const response_body = await response.json;
};

type CreateArticleResult = {
  id: number;
};

export default class MediumGateway {
  apiKey: string;
  requestUrl: RequestUrl;

  constructor(apiKey: string, requestUrl: RequestUrl) {
    this.apiKey = apiKey;
    this.requestUrl = requestUrl;
  }

  async createArticle(input: {
    article: Article;
  }): Promise<CreateArticleResult> {
    return await postArticle(
      { apiKey: this.apiKey, article: input.article },
      this.requestUrl,
    );
  }

  async updateArticle(input: { id: number; article: Article }) {
    return await putArticle(
      { apiKey: this.apiKey, article: input.article, articleId: input.id },
      this.requestUrl,
    );
  }
}
