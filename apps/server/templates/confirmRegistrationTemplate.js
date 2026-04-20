function confirmRegistrationTemplate({ fullName, confirmUrl, denyUrl }) {
    return `
  <div style="font-family: Arial, sans-serif; background:#0b1220; padding:30px; color:#eaf0ff;">
    <div style="max-width:650px; margin:0 auto; background:#0f1a2e; border:1px solid rgba(255,255,255,.10); border-radius:16px; overflow:hidden;">
      
      <div style="padding:22px 22px 10px;">
        <h2 style="margin:0 0 10px; font-size:22px;">Confirm your registration</h2>
        <p style="margin:0; color:#a7b2cc; line-height:1.6;">
          Hi ${fullName}, please confirm your Crypto Earnings registration.
        </p>
      </div>

      <div style="padding:22px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-right:12px; padding-bottom:10px;">
              <a href="${confirmUrl}"
                style="display:inline-block; padding:12px 16px; border-radius:12px; background:#2f6bff; color:#fff; font-weight:800; text-decoration:none;">
                ✅ Confirm Registration
              </a>
            </td>
            <td style="padding-bottom:10px;">
              <a href="${denyUrl}"
                style="display:inline-block; padding:12px 16px; border-radius:12px; background:rgba(255,255,255,.08); color:#fff; font-weight:800; text-decoration:none; border:1px solid rgba(255,255,255,.12);">
                ❌ Deny Registration
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:14px 0 0; color:#a7b2cc; font-size:13px; line-height:1.6;">
          If you didn’t request this, click Deny and ignore this email.
        </p>
      </div>

    </div>
  </div>
  `;
}

module.exports = confirmRegistrationTemplate;
