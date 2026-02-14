export function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatExpiry(date: Date) {
  return date.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function shellTemplate(input: {
  title: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  footerLines: string[];
}) {
  const title = escapeHtml(input.title);
  const intro = escapeHtml(input.intro);
  const ctaLabel = escapeHtml(input.ctaLabel);
  const ctaUrl = escapeHtml(input.ctaUrl);
  const footerHtml = input.footerLines
    .map((line) => `<p style="margin:0 0 6px;color:#6b7280;font-size:12px;line-height:1.45;">${escapeHtml(line)}</p>`)
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0b0d12;font-family:Inter,Arial,sans-serif;color:#f5f7fb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#10141d;border:1px solid #222836;border-radius:12px;padding:24px;">
            <tr><td style="font-size:20px;font-weight:700;color:#f5f7fb;padding-bottom:10px;">${title}</td></tr>
            <tr><td style="font-size:14px;color:#cbd5e1;line-height:1.6;padding-bottom:18px;">${intro}</td></tr>
            <tr>
              <td style="padding-bottom:20px;">
                <a href="${ctaUrl}" style="display:inline-block;background:#f5f7fb;color:#0b0d12;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;">${ctaLabel}</a>
              </td>
            </tr>
            <tr><td>${footerHtml}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return html;
}

