import puppeteer from 'puppeteer';
import fs from 'fs';

const run = async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    const url = process.env.URL || 'http://localhost:5173';
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    const outDir = 'figma-export';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const outPath = `${outDir}/fullpage.png`;
    await page.screenshot({ path: outPath, fullPage: true });
    console.log('Saved', outPath);
    await browser.close();
  } catch (err) {
    console.error('Capture failed:', err);
    process.exit(1);
  }
};

run();
