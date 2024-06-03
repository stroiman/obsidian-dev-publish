type DummyFile = { frontmatter: any };

const getFrontMatterFromFile = async (file: DummyFile) => {
  // This should eventually plugin to Obsidian's API
  return Promise.resolve(file.frontmatter);
};

const createTestTFile = (input?: Partial<DummyFile>): DummyFile => ({
  ...input,
  frontMatter: {},
});

describe("Publish a file from a TFile structure", () => {
  // The TFile is what I have as an abstraction in Obsidian for the currently
  // opened file
  it("Should _update_ if the file has already been published", async () => {
    const publishedArticle = createTestTFile({
      frontMatter: { "medium-article-id": 42 },
    });
  });

  it("Should _create_ if the file has not been published");
});
