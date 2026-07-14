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
    initTransporter() {
        const host = this.config.get('MAIL_HOST');
        if (!host) {
            this.transporter = nodemailer.createTransport({ jsonTransport: true });
            this.logger.warn('MAIL_HOST non défini — emails désactivés (mode dev)');
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
            this.logger.log(`Mail configuré : ${host}`);
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
    async sendCredentials(email, prenom, nom, password, role, companyNom, appUrl) {
        const roleLabels = {
            SUPER_ADMIN: 'Super Administrateur',
            LOGISTIC_ADMIN: 'Responsable Logistique',
            TRANSPORT_ADMIN: 'Administrateur Transport',
            EXPEDITEUR_ADMIN: 'Administrateur Expéditeur',
            FILIERE_ADMIN: 'Administrateur Filière',
            MAGASINIER: 'Magasinier',
            SECURITE: 'Agent de Sécurité',
        };
        const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden">
        <div style="background:#001529;padding:24px;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px">🚛 LogiFlow</h1>
          <p style="color:#90CAF9;margin:6px 0 0 0;font-size:13px">Système de Gestion du Transport</p>
        </div>
        <div style="padding:32px;background:#f9f9f9">
          <h2 style="color:#001529;margin-top:0">Bienvenue sur LogiFlow, ${prenom} !</h2>
          <p style="color:#555">Votre compte a été créé par <strong>${companyNom}</strong>.</p>
          <p style="color:#555">Voici vos identifiants de connexion :</p>
          <div style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:20px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr style="border-bottom:1px solid #f0f0f0">
                <td style="padding:12px 0;color:#888;font-size:13px;width:35%">Nom complet</td>
                <td style="padding:12px 0;font-weight:bold;color:#001529">${prenom} ${nom}</td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0f0">
                <td style="padding:12px 0;color:#888;font-size:13px">Adresse email</td>
                <td style="padding:12px 0;font-weight:bold;color:#001529">${email}</td>
              </tr>
              <tr style="border-bottom:1px solid #f0f0f0">
                <td style="padding:12px 0;color:#888;font-size:13px">Mot de passe</td>
                <td style="padding:12px 0;font-weight:bold;color:#1890ff;font-family:monospace;font-size:20px;letter-spacing:3px">${password}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;color:#888;font-size:13px">Rôle</td>
                <td style="padding:12px 0;color:#1890ff;font-weight:bold">${roleLabels[role] || role}</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center;margin:28px 0">
            <a href="${appUrl}/login" style="background:#1890ff;color:white;padding:14px 36px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block">
              Se connecter à LogiFlow
            </a>
          </div>
          <div style="background:#fff7e6;border:1px solid #ffe7ba;border-radius:6px;padding:12px 16px">
            <p style="margin:0;color:#d46b08;font-size:12px">
              ⚠️ <strong>Sécurité :</strong> Nous vous recommandons de changer votre mot de passe dès votre première connexion via la page Paramètres.
            </p>
          </div>
        </div>
        <div style="background:#001529;padding:14px;text-align:center">
          <p style="color:#555d6b;margin:0;font-size:11px">© 2025 LogiFlow — Système de Gestion du Transport</p>
        </div>
      </div>`;
        return this.send(email, `Vos identifiants de connexion — LogiFlow`, html);
    }
    async sendInvitation(email, companyNom, role, token, frontUrl) {
        const link = `${frontUrl}/accept-invitation/${token}`;
        const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <div style="background:#001529;padding:24px;text-align:center">
          <h1 style="color:white;margin:0">🚛 LogiFlow</h1>
        </div>
        <div style="padding:32px;background:#f9f9f9">
          <h2 style="color:#001529">Invitation à rejoindre ${companyNom}</h2>
          <p>Vous avez été invité à rejoindre la plateforme LogiFlow en tant que <strong>${role}</strong>.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${link}" style="background:#1890ff;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold">
              Créer mon compte
            </a>
          </div>
          <p style="color:#888;font-size:12px">Ce lien expire dans 48 heures.</p>
        </div>
      </div>`;
        return this.send(email, `Invitation à rejoindre ${companyNom} - LogiFlow`, html);
    }
    async sendDailyReport(to, date, companyNom, plans) {
        const validatedPlans = plans.filter((p) => p.bonsLivraison?.length > 0);
        const totalBls = validatedPlans.reduce((s, p) => s + p.bonsLivraison.length, 0);
        const totalTonnage = validatedPlans.reduce((s, p) => s + Number(p.tonnageCharge || 0), 0);
        const rows = validatedPlans.map((plan) => {
            const bls = plan.bonsLivraison.map((bl) => `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0">${bl.numeroBl}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0">${bl.clientNom || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0">${bl.origine || '—'} → ${bl.destination || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center">${bl.tonnageTotal} T</td>
        </tr>`).join('');
            return `
        <div style="margin-bottom:24px;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden">
          <div style="background:#001529;color:white;padding:10px 16px;display:flex;justify-content:space-between">
            <span style="font-weight:700">🚛 ${plan.truck?.matricule}</span>
            <span style="font-size:12px;color:#90CAF9">${plan.truck?.deliveryCompany?.nom || ''} — Capacité : ${plan.truck?.capaciteTonnage}T</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e8e8e8">N° BL</th>
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e8e8e8">Client</th>
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e8e8e8">Trajet</th>
                <th style="padding:8px;text-align:center;border-bottom:2px solid #e8e8e8">Tonnage</th>
              </tr>
            </thead>
            <tbody>${bls}</tbody>
          </table>
        </div>`;
        }).join('');
        const html = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden">
        <div style="background:#001529;padding:20px 24px;text-align:center">
          <h1 style="color:white;margin:0;font-size:22px">🚛 LogiFlow</h1>
          <p style="color:#90CAF9;margin:4px 0 0;font-size:13px">Rapport journalier de chargement</p>
        </div>
        <div style="padding:24px;background:#f9f9f9">
          <h2 style="color:#001529;margin-top:0">Bilan du ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
          <p style="color:#555">Société : <strong>${companyNom}</strong></p>
          <div style="display:flex;gap:16px;margin-bottom:24px">
            ${[
            ['Camions utilisés', validatedPlans.length],
            ['Bons de livraison', totalBls],
            ['Tonnage total', `${totalTonnage.toFixed(1)} T`],
        ].map(([label, val]) => `
              <div style="flex:1;background:white;border:1px solid #e8e8e8;border-radius:6px;padding:12px;text-align:center">
                <div style="font-size:11px;color:#888;margin-bottom:4px">${label}</div>
                <div style="font-size:20px;font-weight:700;color:#001529">${val}</div>
              </div>`).join('')}
          </div>
          ${rows || '<p style="color:#999;text-align:center">Aucun plan validé pour cette date.</p>'}
        </div>
        <div style="background:#001529;padding:12px;text-align:center">
          <p style="color:#555d6b;margin:0;font-size:11px">© 2025 LogiFlow — Ce rapport a été généré automatiquement</p>
        </div>
      </div>`;
        return this.send(to, `Rapport de chargement — ${date} — ${companyNom}`, html);
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