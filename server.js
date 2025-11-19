import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());

app.get("/check", async (req, res) => {
  const target = req.query.url;
  if (!target) {
    return res.json({ success: false, error: "Missing URL parameter" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate
    await page.goto(target, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait a bit for JS to run (or Cloudflare challenge)
    await page.waitForTimeout(5000);

    const html = await page.content();

    res.json({ success: true, html });
  } catch (err) {
    console.error("Error in puppeteer:", err);
    res.json({ success: false, error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
