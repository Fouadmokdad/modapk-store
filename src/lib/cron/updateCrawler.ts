// =============================================================================
// Cron Module — Automatic Version Update Crawler
// =============================================================================
import { db } from "../db";
import { importAppMetadataFromUrl } from "../importers";
import { generateAISeoContent } from "../seo/seoGenerator";
import { resolveFinalMirrorUrl } from "../importers/mirrorResolver";

/**
 * Periodically crawls previously imported apps to check for version changes and update mirrors.
 */
export async function runAutoUpdateCrawler(): Promise<{ checked: number; updated: number }> {
  console.log("[UpdateCrawler] Starting automatic update crawler job...");

  // Load published/draft apps with source URL paths
  const apps = await db.app.findMany({
    where: {
      importedSourceUrl: { not: null },
    },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  let checkedCount = 0;
  let updatedCount = 0;

  for (const app of apps) {
    if (!app.importedSourceUrl) continue;
    checkedCount++;

    try {
      console.log(`[UpdateCrawler] Checking app: ${app.slug} (${app.importedSourceUrl})`);
      
      // Scrape current page details safely using the importer pipeline
      const freshData = await importAppMetadataFromUrl(app.importedSourceUrl);
      const latestSavedVersion = app.versions[0]?.versionName || "";

      if (freshData.versionName && freshData.versionName !== latestSavedVersion) {
        console.log(`[UpdateCrawler] New version detected for ${app.slug}: ${latestSavedVersion} -> ${freshData.versionName}`);
        
        // 1. Create a new AppVersion entry
        const newVersion = await db.appVersion.create({
          data: {
            appId: app.id,
            versionName: freshData.versionName,
            versionCode: freshData.versionCode ? String(freshData.versionCode) : null,
            size: freshData.size,
            minAndroid: freshData.minAndroid,
            apkSize: freshData.size,
            androidRequirement: freshData.minAndroid,
            isLatest: true,
            changelog: freshData.changelog ? (freshData.changelog as any) : undefined,
            modInfo: freshData.modFeatures.length > 0 ? ({ en: freshData.modFeatures.join(", ") } as any) : undefined,
          },
        });

        // Mark previous versions as not latest
        await db.appVersion.updateMany({
          where: {
            appId: app.id,
            id: { not: newVersion.id },
          },
          data: { isLatest: false },
        });

        // 2. Resolve mirrors and save to db DownloadMirror/DownloadLink tables
        for (const mirror of freshData.externalDownloadLinks) {
          const resolved = await resolveFinalMirrorUrl(mirror.url);
          
          await db.downloadMirror.create({
            data: {
              versionId: newVersion.id,
              hostName: resolved.host,
              downloadUrl: resolved.url,
              redirectEnabled: true,
              priority: 0,
              healthStatus: "HEALTHY",
              // legacy compatibility:
              appId: app.id,
              host: resolved.host,
              url: resolved.url,
              health: "HEALTHY",
            },
          });

          await db.downloadLink.create({
            data: {
              versionId: newVersion.id,
              label: mirror.label,
              url: resolved.url,
            },
          });
        }

        // 3. Re-run AI SEO content generation to rewrite description articles with the new version specs
        const seoData = generateAISeoContent({
          title: { en: (app.title as any).en || "" },
          versionName: freshData.versionName,
          developer: app.developer || "Developer",
          category: freshData.category || "Utility",
          packageName: app.packageName || "com.android",
          modFeatures: freshData.modFeatures,
          type: app.type,
        });

        // 4. Update the App metadata details
        await db.app.update({
          where: { id: app.id },
          data: {
            title: seoData.title,
            shortDescription: seoData.shortDescription,
            description: seoData.description,
            rating: freshData.rating || app.rating,
            installs: freshData.installs || app.installs,
          },
        });

        updatedCount++;
        console.log(`[UpdateCrawler] Successfully auto-updated ${app.slug} to ${freshData.versionName}`);
      }
    } catch (err: any) {
      console.error(`[UpdateCrawler] Failed checking updates for ${app.slug}: ${err.message}`);
    }
  }

  console.log(`[UpdateCrawler] Finished crawler sequence. Checked: ${checkedCount}, Updated: ${updatedCount}`);
  return { checked: checkedCount, updated: updatedCount };
}
export const UPDATE_CRAWLER_CRON_EXPRESSION = "0 */6 * * *"; // Every 6 hours
export const MIRROR_HEALTH_CRON_EXPRESSION = "0 * * * *"; // Every hour
