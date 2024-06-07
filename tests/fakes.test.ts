import { expect } from "chai";
import { getMetadata } from "./fakes";

describe("getMetadata", () => {
  it("Handle string starts with a heading", () => {
    const metadata = getMetadata("#  Heading\n\nbody");
    expect(metadata.headings).to.be.like([
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
    const response = getMetadata(input);
    expect(response.headings).to.be.like([
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
