import {
  GenericFileManager,
  GenericVault,
  GetFrontMatterInfo,
} from "./interfaces";
import MediumGateway from "./medium-gateway";

export default class Publisher<TFile> {
  fileManager: GenericFileManager<TFile>;
  gateway: MediumGateway;
  getFrontMatterInfo: GetFrontMatterInfo;
  vault: GenericVault<TFile>;

  constructor(
    fileManager: GenericFileManager<TFile>,
    gateway: MediumGateway,
    vault: GenericVault<TFile>,
    // getFrontMatterInfo: GetFrontMatterInfo,
  ) {
    this.fileManager = fileManager;
    this.gateway = gateway;
    this.vault = vault;
    // this.getFrontMatterInfo = getFrontMatterInfo;
  }

  async publish(file: TFile) {
    const mediumId = await new Promise((resolve, reject) =>
      this.fileManager
        .processFrontMatter(file, (frontmatter) => {
          const mediumId = frontmatter["medium-article-id"];
          // TODO: What if it's not a number?
          resolve(mediumId);
        })
        .catch((err) => reject(err)),
    );
    const article = {
      title: "Foo",
      markdown: await this.vault.read(file),
    };
    if (typeof mediumId === "number") {
      await this.gateway.updateArticle({ id: mediumId, article });
    } else {
      const result = await this.gateway.createArticle({ article });
      this.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter["medium-article-id"] = result.id;
      });
    }
  }
}
