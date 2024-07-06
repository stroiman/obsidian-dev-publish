import { App, Modal } from "obsidian";

export type ImageMappingDialog = Modal;

type EmbeddedImageMapping = {
  imageFile: string;
  publicUrl: string;
};
type ImageMappingList = EmbeddedImageMapping[];

const createTable = (element: HTMLElement, list: EmbeddedImageMapping[]) => {
  const table = element.createEl("table", { attr: { style: "width: 100%" } });
  const inputs: Record<string, HTMLInputElement> = {};
  const thead = table.createEl("thead");
  {
    const tr = thead.createEl("tr");
    tr.createEl("th", { text: "Image" });
    tr.createEl("th", { text: "Public URLx" });
  }
  const tbody = table.createEl("tbody");
  for (const item of list) {
    const tr = tbody.createEl("tr");
    tr.createEl("td", { text: item.imageFile });
    const input = tr.createEl("td").createEl("input", {
      value: item.publicUrl,
      type: "text",
      attr: {
        style: "width: 100%",
        "aria-label": `Enter the public URL where the embedded image "${item.imageFile}" can be found`,
      },
    });
    inputs[item.imageFile] = input;
  }
  return { table, inputs };
};

const showDialog = (
  app: App,
  list: ImageMappingList,
): Promise<null | ImageMappingList> => {
  return new Promise((resolve) => {
    let submitting = false;
    const result = new Modal(app);
    result.onClose = function () {
      if (!submitting) {
        resolve(null);
      }
    };
    result.setTitle("Map image links");
    result.contentEl.createEl("p", {
      text: "Image embeds cannot be uploaded to DEV automatically. You need to make them available, e.g. by uploading manually on DEV, or through some other service. Once done, you can provide the mapping here.",
    });
    const form = result.contentEl.createEl("form");
    const { inputs } = createTable(form, list);
    form.createEl("button", { text: "Submit" });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitting = true;
      form.close();
      resolve(
        list.map((x) => ({
          imageFile: x.imageFile,
          publicUrl: inputs[x.imageFile].value,
        })),
      );
    });
    result.open();
  });
};

export type ShowImageMappingDialog = (
  imageMappingList: ImageMappingList,
) => Promise<ImageMappingList | null>;

class DialogController {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  showImageMappingDialog(list: ImageMappingList) {
    return showDialog(app, list);
  }
}

export type { DialogController };

export default { showDialog };
