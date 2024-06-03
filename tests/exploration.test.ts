import sinon from "sinon";
import { expect } from "chai";
import { foo } from "../src/implementation";
import type { requestUrl } from "obsidian";
import { fetchRequestUrlWrapper } from "./obsidian-wrappers";

type RequestUrl = typeof requestUrl;

describe.skip("Post to dev, using a fetch->requestUrl wrapper for feedback", () => {
  before(async () => {
    /**
     * During development, delete all my draft articles before running, to
     * cleanup.
     *
     * Still, goal is to create a productive feedback loop.
     */
  });

  it("Dev feedback - explore creating a rich article", async () => {
    const articleId = 1875096;
    const body = {
      article: {
        title: "Hello, World!",
        published: false,
        body_markdown:
          "# Hello\n\nTest article\n## Subheading\n\n```ocaml\nlet example=42\n\nlet ( >>= ) = Result.bind\n```\n\nTest",
        tags: [],
        series: "Hello series",
      },
    };
    const response = await fetchRequestUrlWrapper({
      url: `https://dev.to/api/articles/${articleId}`,
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "api-key": process.env.DEV_API_KEY as string,
      },
      contentType: "application/json",
    });
    const response_body = response.json;
    console.log(response_body);
  });

  it.skip("Dev feedback tool only - Get my articles", async () => {
    const response = await fetchRequestUrlWrapper({
      url: "https://dev.to/api/articles/me/unpublished",
      headers: {
        "api-key": process.env.DEV_API_KEY as string,
      },
    });
    console.log(response);
  });

  it.skip("Dev feedback tool only - Should create an article on dev.to", async () => {
    const body = {
      article: {
        title: "Hello, World!",
        published: false,
        body_markdown: "Hello DEV, this is my first post",
        tags: [],
        series: "Hello series",
      },
    };
    const response = await fetchRequestUrlWrapper({
      url: "https://dev.to/api/articles",
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "api-key": process.env.DEV_API_KEY as string,
      },
      contentType: "application/json",
    });
    const response_body = response.json;
    console.log(response_body);
  });
});
