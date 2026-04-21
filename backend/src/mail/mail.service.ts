import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.initTransporter();
  }

  private async initTransporter() {
    const host = this.config.get('MAIL_HOST');

    if (!host || host === 'ethereal') {
      // Mode dev : génère un compte Ethereal automatiquement
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.logger.log(`Ethereal email: ${testAccount.user} / ${testAccount.pass}`);
      this.logger.log(`Preview emails at: https://ethereal.email/messages`);
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port: +this.config.get('MAIL_PORT', '587'),
        secure: this.config.get('MAIL_SECURE') === 'true',
        auth: {
          user: this.config.get('MAIL_USER'),
          pass: this.config.get('MAIL_PASS'),
        },
      });
    }
  }

  private async send(to: string, subject: string, html: string) {
    const from = this.config.get('MAIL_FROM') || 'TMS <noreply@tms.com>';
    const info = await this.transporter.sendMail({ from, to, subject, html });
    // En dev, affiche le lien de preview
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      this.logger.log(`📧 Email preview: ${preview}`);
      return { preview };
    }
    return { messageId: info.messageId };
  }

  async sendInvitation(email: string, companyNom: string, role: string, token: string, frontUrl: string) {
    const link = `${frontUrl}/accept-invitation/${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <div style="background:#001529;padding:24px;text-align:center">
          <h1 style="color:white;margin:0">🚛 TMS</h1>
          <p style="color:#90CAF9;margin:4px 0">Transport Management System</p>
        </div>
        <div style="padding:32px;background:#f9f9f9">
          <h2 style="color:#001529">Invitation à rejoindre ${companyNom}</h2>
          <p>Vous avez été invité à rejoindre la plateforme TMS en tant que <strong>${role}</strong>.</p>
          <p>Cliquez sur le bouton ci-dessous pour créer votre compte :</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${link}" style="background:#1890ff;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold">
              Créer mon compte
            </a>
          </div>
          <p style="color:#888;font-size:12px">Ce lien expire dans 48 heures. Si vous n'attendiez pas cette invitation, ignorez cet email.</p>
        </div>
      </div>`;
    return this.send(email, `Invitation à rejoindre ${companyNom} - TMS`, html);
  }

  async sendResetPassword(email: string, prenom: string, token: string, frontUrl: string) {
    const link = `${frontUrl}/reset-password/${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <div style="background:#001529;padding:24px;text-align:center">
          <h1 style="color:white;margin:0">🚛 TMS</h1>
        </div>
        <div style="padding:32px;background:#f9f9f9">
          <h2 style="color:#001529">Réinitialisation du mot de passe</h2>
          <p>Bonjour <strong>${prenom}</strong>,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${link}" style="background:#ff4d4f;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color:#888;font-size:12px">Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
      </div>`;
    return this.send(email, 'Réinitialisation de votre mot de passe - TMS', html);
  }
}
