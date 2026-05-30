// =============================================================================
// Importer Module — Parser Registry
// =============================================================================
import { ImporterParser } from "./types";
import { LiteApksParser } from "./sources/liteapks";
import { ModyoloParser } from "./sources/modyolo";
import { GameDvaParser } from "./sources/gamedva";
import { GetModsApkParser } from "./sources/getmodsapk";
import { HappyModParser } from "./sources/happymod";
import { UptodownParser } from "./sources/uptodown";
import { ApkPureParser } from "./sources/apkpure";
import { ApkComboParser } from "./sources/apkcombo";
import { DlandroidParser } from "./sources/dlandroid";
import { GenericParser } from "./sources/generic";

/**
 * Registry of domain normalizations mapped directly to specialized parsers.
 */
export const ImporterRegistry: Record<string, ImporterParser> = {
  "liteapks.com": LiteApksParser,
  "modyolo.com": ModyoloParser,
  "gamedva.com": GameDvaParser,
  "getmodsapk.com": GetModsApkParser,
  "happymod.com": HappyModParser,
  "uptodown.com": UptodownParser,
  "apkpure.com": ApkPureParser,
  "apkcombo.com": ApkComboParser,
  "dlandroid.com": DlandroidParser,
};

/**
 * Detects and returns the best parser for a normalized hostname target.
 * Falls back to the GenericParser if no specialized parser is matched.
 */
export function getParserForDomain(domain: string): ImporterParser {
  return ImporterRegistry[domain] || GenericParser;
}
