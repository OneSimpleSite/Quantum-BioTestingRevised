// Email layout and content for the two messages the enquiry form sends.
// Files starting with an underscore in /api are not exposed as routes by Vercel.
// Email clients ignore external CSS and most modern layout, so this is table based with inline styles.
// The logo must be an absolute https URL to a PNG: PUBLIC_SITE_URL (or the default below) + /brand/email-logo.png.

export const TESTS = { mens: 'Men’s Health Check', womens: 'Women’s Health Check' };
const TONE = {
  mens: { line: '#5b86c9', bg: '#e6eefa', ink: '#17407f' },
  womens: { line: '#d58aa9', bg: '#fbe9f0', ink: '#8f2f55' },
};
const C = { blue: '#013275', red: '#b02018', ink: '#0f1d36', muted: '#4b5870', paper: '#fbf3ef', line: '#e7dcd6' };
const FONT = "Arial,Helvetica,sans-serif";
const DISCLAIMER = 'Our services are not a substitute for NHS services. In a medical emergency, call 999.';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const siteUrl = (env = {}) => (env.PUBLIC_SITE_URL || 'https://quantum-bio-testing.vercel.app').replace(/\/+$/, '');

// 28 Oct 2026 style date for people; the stored value stays ISO.
export const niceDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// Outer frame: preheader, accent bar, logo, content, quiet footer. `inner` is already-escaped HTML.
// Deliberately plain: one column on white, hairline rules, no cards or badges.
function frame({ env, preheader, inner, accent = C.blue }) {
  const base = siteUrl(env);
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Quantum BioTesting</title></head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ffffff">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td style="height:5px;line-height:5px;font-size:0;background:${accent}">&nbsp;</td></tr><tr><td align="center" style="padding:36px 24px 40px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">
    <tr><td style="padding:0 0 34px"><a href="${base}/" style="text-decoration:none"><img src="${base}/brand/email-logo.png" width="190" alt="Quantum BioTesting" style="display:block;border:0;outline:none;height:auto;width:190px;max-width:60%"></a></td></tr>
    <tr><td style="font-family:${FONT};font-size:16px;line-height:1.65;color:${C.ink}">${inner}</td></tr>
    <tr><td style="padding:36px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${C.line};padding:18px 0 0;font-family:${FONT};font-size:12.5px;line-height:1.65;color:${C.muted}">
      <p style="margin:0 0 6px">${esc(DISCLAIMER)}</p>
      <p style="margin:0">Quantum BioTesting Ltd, registered in England &amp; Wales. <a href="${base}/privacy/" style="color:${C.muted}">Privacy Policy</a></p>
    </td></tr></table></td></tr>
  </table>
</td></tr></table></body></html>`;
}

const h1 = (t) => `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:30px;line-height:1.15;color:${C.blue}">${esc(t)}</h1>`;
const p = (t, extra = '') => `<p style="margin:0 0 18px;${extra}">${t}</p>`;

// Label and value pairs separated by hairlines. No box, no tint.
function details(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 26px">${rows.map(([k, v]) => `<tr><td valign="top" width="132" style="padding:11px 12px 11px 0;border-top:1px solid ${C.line};font-size:13px;color:${C.muted}">${esc(k)}</td><td valign="top" style="padding:11px 0;border-top:1px solid ${C.line};font-size:15px;color:${C.ink}">${esc(v)}</td></tr>`).join('')}<tr><td colspan="2" style="border-top:1px solid ${C.line};font-size:0;line-height:0">&nbsp;</td></tr></table>`;
}

// Customer: short acknowledgement. Confirms receipt, never implies a booking.
export function confirmationEmail(d, env) {
  const test = TESTS[d.test];
  const first = d.name.split(/\s+/)[0] || d.name;
  const rows = [['Check', test]];
  if (d.clinic) rows.push(['Clinic or area', d.clinic]);
  if (d.date) rows.push(['Preferred date', niceDate(d.date)]);
  const accent = (TONE[d.test] || TONE.mens).line;
  const html = frame({
    env,
    accent,
    preheader: 'We’ll be in touch by email to confirm your clinic and appointment time.',
    inner:
      h1(`Thanks, ${first}.`) +
      p(`We’ve received your enquiry about the ${esc(test)}. We’ll be in touch by email to confirm your clinic and appointment time.`) +
      details(rows) +
      p('This isn’t a confirmed booking yet. If anything needs changing, just reply to this email.') +
      `<p style="margin:26px 0 0">Kind regards,<br><strong>Quantum BioTesting</strong></p>`,
  });
  const text = `Thanks, ${first}.\n\nWe’ve received your enquiry about the ${test}. We’ll be in touch by email to confirm your clinic and appointment time.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nThis isn’t a confirmed booking yet. If anything needs changing, just reply to this email.\n\nKind regards,\nQuantum BioTesting\n\n${DISCLAIMER}\n`;
  return { html, text };
}

// Team: everything needed to reply, one clear action.
export function teamEmail(d, env) {
  const test = TESTS[d.test];
  const rows = [
    ['Check', test], ['Name', d.name], ['Email', d.email], ['Phone', d.phone],
    ['Clinic or area', d.clinic || 'Not given'],
    ['Preferred date', d.date ? `${niceDate(d.date)} (a request, not confirmed)` : 'Not given'],
    ['Notes', d.notes || 'None'],
  ];
  const accent = (TONE[d.test] || TONE.mens).line;
  const first = d.name.split(/\s+/)[0] || d.name;
  const subject = encodeURIComponent(`Your ${test} enquiry`);
  const html = frame({
    env,
    accent,
    preheader: `${d.name} would like the ${test}. Reply to this email to reach them.`,
    inner:
      `<p style="margin:0 0 6px;font-size:13px;color:${C.muted}">New website enquiry</p>` +
      h1(d.name) +
      details(rows) +
      `<p style="margin:0 0 14px"><a href="mailto:${esc(d.email)}?subject=${subject}" style="color:${C.red};font-weight:700;text-decoration:underline">Reply to ${esc(first)}</a></p>` +
      `<p style="margin:0;font-size:14px;color:${C.muted}">You can also just reply to this email. It is not a confirmed booking until you confirm the clinic and time.</p>`,
  });
  const text = `A new appointment enquiry has come in from the website.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nReply to this email to reach ${d.name}. It is not a confirmed booking until you confirm the clinic and time.\n`;
  return { html, text };
}
