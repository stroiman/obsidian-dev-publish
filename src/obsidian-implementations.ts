import * as interfaces from "./interfaces";
import { FrontMatterInfo, getFrontMatterInfo } from "obsidian";

export class GetFrontMatterInfo implements interfaces.GetFrontMatterInfo {
  getFrontMatterInfo(contents: string): FrontMatterInfo {
    return getFrontMatterInfo(contents);
  }
}
