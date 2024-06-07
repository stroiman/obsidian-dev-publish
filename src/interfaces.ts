/**
 * Generic interfaces that partially match Obsidian's build in interfaces, in
 * order to allow us to
 *  - Not have to mock the entire Obsidian API, just the parts we care about
 *  - Replace types in obsidian with simpler test types to alien with ISP
 *    - ISP - Interface Segregation Principle - our code does not depend on
 *      obsidian properties that we do not need or care about.
 */

import type { FrontMatterInfo } from "obsidian";
import * as obsidian from "obsidian";

export interface GenericFileManager<TFile> {
  processFrontMatter(
    file: TFile,
    fn: (frontmatter: any) => void,
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

type HeadingCache = Omit<obsidian.HeadingCache, "position"> & { position: Pos };

export type CachedMetadata = {
  headings?: HeadingCache[];
};

export interface GenericMetadataCache<TFile> {
  getFileCache(file: TFile): CachedMetadata;
}

export interface GenericApp<TFile> {
  fileManager: GenericFileManager<TFile>;
  vault: GenericVault<TFile>;
  metadataCache: GenericMetadataCache<TFile>;
}
