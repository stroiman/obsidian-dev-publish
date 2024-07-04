/*
 * Test helpers for creating "domain" objects, which are just fakes in the
 * test context
 */

import { FakeFile } from "./fakes";

let nextFileId = 1;
const createFilePath = () => `file-${nextFileId++}.md`;

export const createFakeFile = (input?: Partial<FakeFile>): FakeFile => ({
  path: createFilePath(),
  frontmatter: {},
  contents: "",
  ...input,
});
