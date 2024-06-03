import { GenericFileManager } from "./interfaces";
import MediumGateway from "./medium-gateway";

export default class Publisher<TFile> {
  fileManager: GenericFileManager<TFile>;
  gateway: MediumGateway;
  constructor(fileManager: GenericFileManager<TFile>, gateway: MediumGateway) {
    this.fileManager = fileManager;
    this.gateway = gateway;
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
    if (typeof mediumId === "number") {
      await this.gateway.updateArticle({ id: mediumId });
    } else {
      const result = await this.gateway.createArticle();
      this.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter["medium-article-id"] = result.id;
      });
    }
  }
}
