import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function generatePngs() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const svgContent = fs.readFileSync('public/favicon.svg', 'utf-8');
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${svgContent}</body></html>`);

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];

  for (const { name, size } of sizes) {
    const svgEl = await page.$('svg');
    await svgEl.evaluate((el, s) => {
      el.setAttribute('width', s);
      el.setAttribute('height', s);
    }, size);
    await page.setViewportSize({ width: size, height: size });
    await svgEl.screenshot({
      path: path.join('public', name),
      omitBackground: true,
    });
    console.log(`Generated public/${name}`);
  }

  await browser.close();
}

generatePngs().catch(console.error);
