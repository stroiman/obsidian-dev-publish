import { expect } from "chai";
import { getHeadings, getLinks, getMetadata } from "./fakes";

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
      expect(links).to.be.like([{
        displayText: "Alias",
        link: "Link",
        original: "[[Link|Alias]]",
        position: { start: { offset: 6 }, end: { offset: 20 } },
      }]);
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
});
