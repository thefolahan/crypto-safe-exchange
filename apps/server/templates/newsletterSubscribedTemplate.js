function newsletterSubscribedTemplate({ email }) {
    return `
  <div style="font-family: Arial, sans-serif; background:#0b1220; padding:30px; color:#eaf0ff;">
    <div style="max-width:650px; margin:0 auto; background:#0f1a2e; border:1px solid rgba(255,255,255,.10); border-radius:16px; overflow:hidden;">
      <div style="padding:22px 22px 10px;">
        <h2 style="margin:0 0 10px; font-size:22px;">✅ You’re subscribed!</h2>
        <p style="margin:0; color:#a7b2cc; line-height:1.7;">
          Thanks for subscribing to <b>Crypto Earnings</b> newsletter.
          You’ll now receive the latest updates and offers.
        </p>
      </div>

      <div style="padding:0 22px 22px;">
        <p style="margin:16px 0 0; color:#a7b2cc; font-size:13px; line-height:1.6;">
          This email was sent to: <span style="color:#eaf0ff; font-weight:700;">${email}</span>
        </p>
      </div>

      <div style="padding:18px 22px; border-top:1px solid rgba(255,255,255,.08);">
        <p style="margin:0; color:#a7b2cc; font-size:13px; line-height:1.6;">
          If you didn’t subscribe, you can ignore this email.
        </p>
      </div>
    </div>
  </div>
  `;
}

module.exports = newsletterSubscribedTemplate;
