import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());

app.get("/check", async (req, res) => {
    const target = req.query.url;
    if (!target) return res.json({ success: false, error: "Missing URL" });

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process"
            ]
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );

        await page.setJavaScriptEnabled(true);

        // Try loading (Cloudflare bypass)
        await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });

        // Wait if Cloudflare challenge appears
        await page.waitForTimeout(5000);

        let html = await page.content();

        res.json({
            success: true,
            html
        });

    } catch (err) {
        res.json({
            success: false,
            error: err.message
        });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(8080, () => console.log("Server running on port 8080"));
