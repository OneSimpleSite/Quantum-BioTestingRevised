// Renders both emails with sample data to docs/email-previews (HTML and PNG) for visual review.
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { buildMessage, buildConfirmation } from '../api/enquiry.js';

const env = { ENQUIRY_FROM: 'Quantum BioTesting <enquiries@example.com>', ENQUIRY_TO: 'team@example.com', PUBLIC_SITE_URL: 'http://localhost:4391' };
const sample = { test: 'womens', name: 'Jane Smith', email: 'jane@example.com', phone: '07700 900123', clinic: 'Fulham, London', date: '2027-01-05', notes: 'Mornings are easiest for me.' };
const samples = { 'customer-womens': buildConfirmation(sample, env), 'customer-mens': buildConfirmation({ ...sample, test: 'mens' }, env), 'team-womens': buildMessage(sample, env), 'team-mens': buildMessage({ ...sample, test: 'mens' }, env) };
mkdirSync('docs/email-previews', { recursive: true });
for (const [k, m] of Object.entries(samples)) writeFileSync(`docs/email-previews/${k}.html`, m.html.replaceAll(env.PUBLIC_SITE_URL, '../../public'));
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const w of [640, 375]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 800 } })).newPage();
  for (const k of Object.keys(samples)) {
    await p.goto(`file://${process.cwd()}/docs/email-previews/${k}.html`); await p.waitForTimeout(150);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const logo = await p.evaluate(() => { const i = document.querySelector('img'); return i.complete && i.naturalWidth > 0; });
    console.log(k, w, 'overflow', over, 'logo', logo);
    await p.screenshot({ path: `docs/email-previews/${k}-${w}.png`, fullPage: true });
  }
}
await b.close();
