/**
 * Generic interfaces that partially match Obsidian's build in interfaces, in
 * order to allow us to
 *  - Not have to mock the entire Obsidian API, just the parts we care about
 *  - Replace types in obsidian with simpler test types to alien with ISP
 *    - ISP - Interface Segregation Principle - our code does not depend on
 *      obsidian properties that we do not need or care about.
 */

export interface GenericFileManager<TFile> {
  processFrontMatter(
    file: TFile,
    fn: (frontmatter: any) => void,
  ): Promise<void>;
}
