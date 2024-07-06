import { expect } from "chai";
import { getHeadings, getLinks, getMetadata } from "./fakes";
import { createFakeFile } from "./factories";

/**
 * This code tests test code, but because the way Obsidian is build, all the
 * good stuff I want to have access to when running tests are not available,
 * such as detecting where headers/sections/links are located.
 *
 * This leaves me with three choices
 *  1. Don't test (not a choice really)
 *  2. Write tests coupled to the API of Obsidian. A really bad idea
 *  3. Write tests expressing desired behaviour, duplicating parts of the
 *     markdown processing in Obsidian itself
 *
 * There is really only one choice, duplicate functionality in Obsidian.
 */
describe("getMetadata", () => {
  describe("Getting links", () => {
    // displayText : "Another article"
    // link : "Another article"
    // original : "[[Another article]]"
    it("Returns the right for plain links", () => {
      const links = getLinks("start [[Link]] end");
      expect(links).to.be.like([
        {
          displayText: "Link",
          link: "Link",
          original: "[[Link]]",
          position: { start: { offset: 6 }, end: { offset: 14 } },
        },
      ]);
    });

    it("Returns the right for links with alias", () => {
      const links = getLinks("start [[Link|Alias]] end");
      expect(links).to.be.like([
        {
          displayText: "Alias",
          link: "Link",
          original: "[[Link|Alias]]",
          position: { start: { offset: 6 }, end: { offset: 20 } },
        },
      ]);
    });
  });

  describe("Getting headings", () => {
    it("Handle string starts with a heading", () => {
      const headings = getHeadings("#  Heading\n\nbody");
      expect(headings).to.be.like([
        {
          heading: "Heading",
          level: 1,
          position: { start: { offset: 0 }, end: { offset: 10 } },
        },
      ]);
    });

    it("Handles multiple headings", () => {
      const input = `ignore
# H1

paragraph
## H2A

paragraph
## H2B
### H3

#tag - ignore this`;
      const headings = getHeadings(input);
      expect(headings).to.be.like([
        {
          heading: "H1",
          level: 1,
          position: {
            start: { offset: 7 },
            end: { offset: 11 },
          },
        },
        {
          heading: "H2A",
          level: 2,
          position: {
            start: { offset: 23 },
            end: { offset: 29 },
          },
        },
        {
          heading: "H2B",
          level: 2,
        },
        {
          heading: "H3",
          level: 3,
        },
      ]);
    });
  });

  describe("Embedbed resolution", () => {
    it("Handles embeds", () => {
      const file = createFakeFile({
        contents: `This is a paragraph.
With two lines.

![[embedded-image-without-link-text.png]]

This is a paragraph with an image ![[inline-image.png|with link text]] in the
text.
`,
      });
      const md = getMetadata(file);
      const image1 = md.embeds?.at(0)!; // eslint-disable-line
      const image2 = md.embeds?.at(1)!; // eslint-disable-line
      expect(image1).to.be.like({
        link: "embedded-image-without-link-text.png",
        original: "![[embedded-image-without-link-text.png]]",
      });
      const image1Str = file.contents.substring(
        image1.position.start.offset,
        image1.position.end.offset,
      );
      expect(image1Str).to.equal("![[embedded-image-without-link-text.png]]");
      // ![[inline-image.png|with link text]]
      expect(image2).to.be.like({
        link: "inline-image.png",
        original: "![[inline-image.png|with link text]]",
        displayText: "with link text",
      });
      const image2Str = file.contents.substring(
        image2.position.start.offset,
        image2.position.end.offset,
      );
      expect(image2Str).to.equal("![[inline-image.png|with link text]]");
    });
  });
});
