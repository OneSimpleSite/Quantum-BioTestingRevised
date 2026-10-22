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

// Outer frame: preheader, logo, white card, footer. `inner` is already-escaped HTML.
function frame({ env, preheader, inner }) {
  const base = siteUrl(env);
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Quantum BioTesting</title></head>
<body style="margin:0;padding:0;background:${C.paper};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper}">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
    <tr><td style="padding:0 4px 18px"><a href="${base}/" style="text-decoration:none"><img src="${base}/brand/email-logo.png" width="220" alt="Quantum BioTesting" style="display:block;border:0;outline:none;height:auto;width:220px;max-width:70%"></a></td></tr>
    <tr><td style="background:#ffffff;border:1px solid ${C.line};border-top:4px solid ${C.blue};border-radius:14px;padding:32px 30px;font-family:${FONT};font-size:16px;line-height:1.6;color:${C.ink}">${inner}</td></tr>
    <tr><td style="padding:22px 8px 0;font-family:${FONT};font-size:12.5px;line-height:1.6;color:${C.muted}">
      <p style="margin:0 0 8px">${esc(DISCLAIMER)}</p>
      <p style="margin:0">Quantum BioTesting Ltd. Registered in England &amp; Wales.<br><a href="${base}/privacy/" style="color:${C.muted}">Privacy Policy</a> &nbsp;·&nbsp; <a href="${base}/" style="color:${C.muted}">Website</a></p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const h1 = (t) => `<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:26px;line-height:1.2;color:${C.blue}">${esc(t)}</h1>`;
const p = (t, extra = '') => `<p style="margin:0 0 16px;${extra}">${t}</p>`;

// Tinted card in the colour of the chosen check: blue for men's, pink for women's.
function summaryCard(testKey, rows) {
  const t = TONE[testKey] || TONE.mens;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:${t.bg};border:1.5px solid ${t.line};border-radius:12px"><tr><td style="padding:16px 20px">
    <p style="margin:0 0 8px;font-family:${FONT};font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:${t.ink}">Your enquiry</p>
    ${rows.map(([k, v]) => `<p style="margin:0 0 4px;font-size:15px"><span style="color:${C.muted}">${esc(k)}:</span> <strong style="color:${C.ink}">${esc(v)}</strong></p>`).join('')}
  </td></tr></table>`;
}

const button = (href, label, colour = C.red) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px"><tr><td style="border:2px solid ${colour};border-radius:999px"><a href="${esc(href)}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:16px;font-weight:700;color:${colour};text-decoration:none">${esc(label)}</a></td></tr></table>`;

// Customer: short acknowledgement. Confirms receipt, never implies a booking.
export function confirmationEmail(d, env) {
  const test = TESTS[d.test];
  const first = d.name.split(/\s+/)[0] || d.name;
  const rows = [['Check', test]];
  if (d.clinic) rows.push(['Clinic or area', d.clinic]);
  if (d.date) rows.push(['Preferred date', niceDate(d.date)]);
  const next = [
    'We email you to confirm your clinic and appointment time.',
    'Your appointment is confirmed once you have that email.',
  ];
  const base = siteUrl(env);
  const html = frame({
    env,
    preheader: 'Thanks for your enquiry. We will email you again to confirm your clinic and time.',
    inner:
      h1(`Hi ${first}, we’ve got your enquiry`) +
      p(`Thanks for getting in touch about the ${esc(test)}. We will email you again soon to confirm your clinic and appointment time.`) +
      summaryCard(d.test, rows) +
      `<p style="margin:0 0 8px;font-weight:700;color:${C.blue}">What happens next</p>` +
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px">${next.map((s, i) => `<tr><td valign="top" style="padding:0 12px 8px 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="26" height="26" style="width:26px;height:26px;border:2px solid ${C.blue};border-radius:13px;font-family:${FONT};font-size:13px;font-weight:700;color:${C.blue}">${i + 1}</td></tr></table></td><td style="padding:0 0 8px;font-size:15px">${esc(s)}</td></tr>`).join('')}</table>` +
      p('This isn’t a confirmed booking yet. If you need to change anything, just reply to this email.') +
      `<p style="margin:0;font-size:14px;color:${C.muted}">Want to know what to expect? Read <a href="${base}/how-it-works/" style="color:${C.blue};font-weight:700">how it works</a>.</p>`,
  });
  const text = `Hi ${first},\n\nThanks for getting in touch about the ${test}. We’ve got your enquiry and will email you again soon to confirm your clinic and appointment time.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nWhat happens next\n${next.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nThis isn’t a confirmed booking yet. If you need to change anything, just reply to this email.\n\nQuantum BioTesting\n${DISCLAIMER}\n`;
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
  const t = TONE[d.test] || TONE.mens;
  const subject = encodeURIComponent(`Your ${test} enquiry`);
  const html = frame({
    env,
    preheader: `${d.name} would like the ${test}. Reply to this email to reach them.`,
    inner:
      `<p style="margin:0 0 10px"><span style="display:inline-block;padding:4px 12px;border:1.5px solid ${t.line};background:${t.bg};color:${t.ink};border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">${esc(test)}</span></p>` +
      h1(`New enquiry from ${d.name}`) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse">${rows.map(([k, v]) => `<tr><td valign="top" width="130" style="padding:10px 12px 10px 0;border-top:1px solid ${C.line};font-size:14px;color:${C.muted}">${esc(k)}</td><td valign="top" style="padding:10px 0;border-top:1px solid ${C.line};font-size:15px;color:${C.ink}${k === 'Notes' ? ';white-space:pre-wrap' : ''}">${esc(v)}</td></tr>`).join('')}</table>` +
      button(`mailto:${d.email}?subject=${subject}`, `Reply to ${d.name.split(/\s+/)[0] || d.name}`) +
      `<p style="margin:14px 0 0;font-size:14px;color:${C.muted}">You can also reply to this email to reach ${esc(d.name)}. It is not a confirmed booking until you confirm the clinic and time.</p>`,
  });
  const text = `A new appointment enquiry has come in from the website.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nReply to this email to reach ${d.name}. It is not a confirmed booking until you confirm the clinic and time.\n`;
  return { html, text };
}
