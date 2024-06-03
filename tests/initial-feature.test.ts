import sinon from "sinon";
import { expect } from "chai";
import { foo } from "../src/implementation";
import type { requestUrl } from "obsidian";

type RequestUrl = typeof requestUrl;

/**
 * Wraps Obsidian's requestUrl, which is part of the closed source code, so
 * it's not available when running tests.
 *
 *
 * Use the `typeof` TypeScript operator to make sure the wrapper has EXACTLY the
 * same type as the wrapped function.
 */
class RequestUrlWrapper {
  wrappedRequestUrl: RequestUrl;

  constructor(requestUrl: RequestUrl) {
    this.wrappedRequestUrl = requestUrl;
  }

  requestUrl(...args: Parameters<RequestUrl>) {
    return this.wrappedRequestUrl(...args);
  }
}

/**
 * This is for feedback only during development.
 *
 * The obsidian plugin has to use `requestUrl` to call an external HTTP server,
 * but I want to be able to run my code, and visually inspect the article
 * created on dev.to.
 *
 * Having to run this from inside obsidian just takes too long, as I need to
 * build, switch to obsidian, run a command (manually), and see the results.
 *
 * I invest some time in building the tooling providing faster feedback, so
 * as to not break the flow
 */
const fetchRequestUrlWrapper = async (
  options: Parameters<RequestUrl>[0],
): Promise<ReturnType<RequestUrl>> => {
  if (typeof options === "string") {
    return fetchRequestUrlWrapper({ url: options });
  }
  const headers = {
    ...options.headers,
    ...(options.contentType && { "Content-Type": options.contentType }),
  };
  const fetchOptions = {
    method: options.method || "GET",
    headers,
    body: options.body,
  };
  const fetchResponse = await fetch(options.url, fetchOptions);
  const throwOnError = options.throw ?? true; // Default value in obsidian
  if (!fetchResponse.ok && throwOnError) {
    throw new Error("Error from server");
  }
  type RequestUrlReturnType = Awaited<ReturnType<RequestUrl>>;
  const responseHeaders: Record<string, string> = {};
  fetchResponse.headers.forEach((val, key) => (responseHeaders[key] = val));
  const json = await fetchResponse.json();
  return {
    get arrayBuffer(): ArrayBuffer {
      throw new Error("We don't use this");
    },
    headers: responseHeaders,
    json,
    status: fetchResponse.status,
    get text(): string {
      throw new Error("We don't use this");
    },
  };
};

describe("Post to dev, using a fetch->requestUrl wrapper for feedback", () => {
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
