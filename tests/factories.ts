/*
 * Test helpers for creating "domain" objects, which are just fakes in the
 * test context
 */

import { FakeFile } from "./fakes";

export const createFakeFile = (input?: Partial<FakeFile>): FakeFile => ({
  frontmatter: {},
  contents: "",
  ...input,
});
