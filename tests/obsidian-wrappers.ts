import type { requestUrl } from "obsidian";
import { HttpResponse } from "src/medium-gateway";

type RequestUrl = typeof requestUrl;

/**
 * Wraps Obsidian's requestUrl, which is part of the closed source code, so
 * it's not available when running tests.
 *
 *
 * Use the `typeof` TypeScript operator to make sure the wrapper has EXACTLY the
 * same type as the wrapped function.
 */
export class RequestUrlWrapper {
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
export const fetchRequestUrlWrapper = async (
  options: Parameters<RequestUrl>[0],
): Promise<HttpResponse> => {
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
    console.error("Server status", fetchResponse.status);
    throw new Error("Error from server");
  }
  const json = fetchResponse.json();
  return { json };
};
