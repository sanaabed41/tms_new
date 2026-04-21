"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    config;
    logger = new common_1.Logger(MailService_1.name);
    transporter;
    constructor(config) {
        this.config = config;
        this.initTransporter();
    }
    async initTransporter() {
        const host = this.config.get('MAIL_HOST');
        if (!host || host === 'ethereal') {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                auth: { user: testAccount.user, pass: testAccount.pass },
            });
            this.logger.log(`Ethereal email: ${testAccount.user} / ${testAccount.pass}`);
            this.logger.log(`Preview emails at: https://ethereal.email/messages`);
        }
        else {
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
    async send(to, subject, html) {
        const from = this.config.get('MAIL_FROM') || 'TMS <noreply@tms.com>';
        const info = await this.transporter.sendMail({ from, to, subject, html });
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) {
            this.logger.log(`📧 Email preview: ${preview}`);
            return { preview };
        }
        return { messageId: info.messageId };
    }
    async sendInvitation(email, companyNom, role, token, frontUrl) {
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
    async sendResetPassword(email, prenom, token, frontUrl) {
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
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map