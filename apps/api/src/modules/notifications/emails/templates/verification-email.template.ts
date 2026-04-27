/**
 * Email verification template.
 * Returns plain HTML string — no template engine needed at this stage.
 */
export function verificationEmailTemplate(verificationUrl: string): {
  subject: string;
  html: string;
} {
  return {
    subject: 'FlashMe — Verify your email',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify your email</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; padding:40px;">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <h1 style="margin:0; font-size:24px; color:#18181b;">FlashMe</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px; font-size:16px; color:#3f3f46; line-height:1.5;">
                    Welcome to FlashMe! Click the button below to verify your email address.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:24px 0;">
                    <a href="${verificationUrl}"
                       style="display:inline-block; padding:12px 32px; background-color:#18181b; color:#ffffff; text-decoration:none; border-radius:6px; font-size:16px; font-weight:600;">
                      Verify my email
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px; font-size:14px; color:#71717a; line-height:1.5;">
                    This link expires in 24 hours. If you didn't create an account on FlashMe, you can safely ignore this email.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:24px; font-size:12px; color:#a1a1aa;">
                    If the button doesn't work, copy and paste this URL into your browser:<br/>
                    <a href="${verificationUrl}" style="color:#3b82f6; word-break:break-all;">${verificationUrl}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}
