import type { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend: ResendConstructor } = require("resend");
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const instance = new ResendConstructor(apiKey);
  _resend = instance;
  return instance;
}

export async function sendMagicLinkEmail(email: string, url: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[resend] RESEND_API_KEY not set — skipping email send to", email);
    return;
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "contact@metiersdart-geneve.ch";

  await getResend().emails.send({
    from: `Métiers d'Art Genève <${fromEmail}>`,
    to: email,
    subject: "Votre lien de connexion — Métiers d'Art Genève",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #b42c36;">Métiers d'Art Genève</h1>
        <p>Bonjour,</p>
        <p>Vous avez demandé un lien de connexion à votre espace MAG.</p>
        <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${url}"
             style="background-color: #b42c36; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 100px; font-weight: bold;">
            Se connecter
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Ce lien expirera dans 24 heures. Si vous n'avez pas demandé cette connexion, ignorez cet e-mail.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="color: #999; font-size: 12px;">
          Métiers d'Art Genève (MAG) — contact@metiersdart-geneve.ch
        </p>
      </div>
    `,
  });
}
