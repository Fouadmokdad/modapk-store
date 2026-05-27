/**
 * MOD APK Store — Browser-Side Metadata Extractor Widget Script
 * Drag or click bookmarklet to execute this on any anti-bot protected target page.
 */
(async function () {
  // 1. Render a professional floating status widget overlay
  const widget = document.createElement("div");
  widget.id = "mod-apk-store-extractor-overlay";
  widget.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999999;
    width: 320px;
    background: rgba(18, 18, 18, 0.96);
    color: #ffffff;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 24px;
    backdrop-filter: blur(16px);
    box-sizing: border-box;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  widget.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
      <span style="font-size: 20px;">🛡️</span>
      <h4 style="margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; color: #10B981; text-transform: uppercase;">Smart Extractor</h4>
    </div>
    <p id="ext-status-txt" style="margin: 0 0 12px 0; font-size: 12px; color: #d1d5db; line-height: 1.5;">Preparing page metadata extraction...</p>
    <div style="height: 4px; width: 100%; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden; margin-bottom: 14px;">
      <div id="ext-status-bar" style="height: 100%; width: 15%; background: #10B981; transition: width 0.4s ease; border-radius: 2px;"></div>
    </div>
    <div id="ext-actions" style="display: none;"></div>
  `;
  document.body.appendChild(widget);

  const updateStatus = (text, progress, isError = false) => {
    const statusTxt = document.getElementById("ext-status-txt");
    const statusBar = document.getElementById("ext-status-bar");
    if (statusTxt) statusTxt.innerHTML = text;
    if (statusBar) {
      statusBar.style.width = `${progress}%`;
      statusBar.style.background = isError ? "#EF4444" : "#10B981";
    }
    if (isError) {
      widget.style.borderColor = "rgba(239, 68, 68, 0.4)";
    }
  };

  try {
    updateStatus("🔍 Analyzing DOM elements and selectors...", 30);

    // Extract page metadata elements
    const url = window.location.href;
    const docTitle = document.title;
    const ogTitle = document.querySelector("meta[property='og:title']")?.getAttribute("content") || "";
    const description = document.querySelector("meta[name='description']")?.getAttribute("content") || 
                        document.querySelector("meta[property='og:description']")?.getAttribute("content") || "";
    const canonical = document.querySelector("link[rel='canonical']")?.getAttribute("href") || url;

    // Grab images & screenshots safely
    const images = Array.from(document.querySelectorAll("img")).map(i => i.src).filter(src => src.startsWith("http"));
    const iconUrl = document.querySelector("link[rel='apple-touch-icon']")?.getAttribute("href") ||
                    document.querySelector("link[rel='icon']")?.getAttribute("href") ||
                    images[0] || null;

    // Collect breadcrumbs
    const breadcrumbs = Array.from(document.querySelectorAll(".breadcrumb a, .breadcrumbs a, [class*='breadcrumb'] a"))
      .map(el => el.textContent?.trim())
      .filter(Boolean);

    // Parse developer & category based on common classnames
    const developer = document.querySelector("[class*='developer'], [class*='author'], .dev")?.textContent?.trim() || null;
    const category = document.querySelector("[class*='category'], .cat, [href*='category']")?.textContent?.trim() || null;
    const ratingText = document.querySelector("[class*='rating'], .score, [class*='star']")?.textContent?.trim() || "";
    const rating = parseFloat(ratingText.replace(/[^0-9.]/g, "")) || null;

    // Parse mod features
    const modFeatures = Array.from(document.querySelectorAll("[class*='mod-feature'], .mod-info li, [class*='modfeatures'] li"))
      .map(el => el.textContent?.trim())
      .filter(Boolean);

    // Gather external download mirror candidates
    const downloadLinks = Array.from(document.querySelectorAll("a[href*='download'], a[href*='mirror'], a[class*='download']"))
      .map(el => ({
        label: el.textContent?.trim() || "Download Mirror",
        url: el.href
      }))
      .filter(link => link.url.startsWith("http"));

    const smartMetadata = {
      title: ogTitle || docTitle,
      description,
      canonical,
      iconUrl,
      screenshots: images.slice(1, 6),
      breadcrumbs,
      developer,
      category,
      rating,
      modFeatures,
      downloadLinks
    };

    updateStatus("📦 Compressing HTML DOM payload...", 65);

    let html = document.documentElement.outerHTML;
    let compressedHtml = null;
    let compressionSuccess = false;

    // Native Gzip Compression using CompressionStream
    if (typeof CompressionStream !== "undefined") {
      try {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(html));
            controller.close();
          }
        });
        const compressor = stream.pipeThrough(new CompressionStream("gzip"));
        const buffer = await new Response(compressor).arrayBuffer();
        compressedHtml = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        compressionSuccess = true;
      } catch (err) {
        console.warn("Gzip compression failed. Falling back...", err);
      }
    }

    updateStatus("🚀 Broadcasting payload securely to Opener...", 85);

    const payload = {
      type: "BROWSER_IMPORT_PAYLOAD",
      url,
      html: compressionSuccess ? null : html,
      compressedHtml: compressionSuccess ? compressedHtml : null,
      smartMetadata
    };

    // Broadcast message safely to window.opener or parent frame
    const targetWindow = window.opener || window.parent;
    if (targetWindow && targetWindow !== window) {
      let ackReceived = false;

      // Handle ACK confirmation handshake
      const ackListener = (event) => {
        if (event.data?.type === "BROWSER_IMPORT_ACK") {
          ackReceived = true;
          updateStatus("🎉 Payload Accepted! Auto-closing window in 1s...", 100);
          window.removeEventListener("message", ackListener);
          setTimeout(() => {
            widget.remove();
            window.close(); // Auto-close popup window upon success
          }, 1200);
        }
      };
      window.addEventListener("message", ackListener);

      // Retry transmission loop
      let attempts = 0;
      const interval = setInterval(() => {
        if (ackReceived) {
          clearInterval(interval);
          return;
        }
        attempts++;
        if (attempts > 30) {
          clearInterval(interval);
          window.removeEventListener("message", ackListener);
          updateStatus("⚠️ Dashboard not active or authenticated. Confirm tab is open.", 90, true);
        } else {
          targetWindow.postMessage(payload, "*");
        }
      }, 500);

    } else {
      updateStatus("❌ Window Opener not found! Make sure you opened this page via the dashboard trigger.", 100, true);
    }
  } catch (err) {
    updateStatus(`❌ Extractor error: ${err.message || err}`, 100, isError = true);
  }
})();
