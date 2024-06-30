/**
 * Generic interfaces that partially match Obsidian's build in interfaces, in
 * order to allow us to
 *  - Not have to mock the entire Obsidian API, just the parts we care about
 *  - Replace types in obsidian with simpler test types to alien with ISP
 *    - ISP - Interface Segregation Principle - our code does not depend on
 *      obsidian properties that we do not need or care about.
 */

import type { FrontMatterInfo, FrontMatterCache } from "obsidian";
import * as obsidian from "obsidian";
import { JsonObject } from "./publisher";

export interface GenericFileManager<TFile> {
  processFrontMatter(
    file: TFile,
    fn: (frontmatter: JsonObject) => void,
  ): Promise<void>;
}

export interface GenericVault<TFile> {
  read(file: TFile): Promise<string>;
}

export interface GetFrontMatterInfo {
  getFrontMatterInfo(contents: string): FrontMatterInfo;
}

type Loc = Pick<obsidian.Loc, "offset">;
type Pos = {
  start: Loc;
  end: Loc;
};

export type HeadingCache = Omit<obsidian.HeadingCache, "position"> & {
  position: Pos;
};

export type LinkCache = {
  displayText?: string;
  link: string;
  original: string;
  position: Pos;
};

export type CachedMetadata = {
  links?: LinkCache[];
  headings?: HeadingCache[];
  frontmatter?: JsonObject;
};

export interface GenericMetadataCache<TFile> {
  getFileCache(file: TFile): CachedMetadata | null;
  getFirstLinkpathDest(link: string, path: string): TFile | null;
}

export interface GenericApp<TFile> {
  fileManager: GenericFileManager<TFile>;
  vault: GenericVault<TFile>;
  metadataCache: GenericMetadataCache<TFile>;
}
