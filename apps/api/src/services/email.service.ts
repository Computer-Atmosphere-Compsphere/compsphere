import nodemailer, { Transporter } from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { db, schema } from "@compsphere/db";
import { eq } from "drizzle-orm";

const APP_URL = process.env.APP_URL || process.env.BETTER_AUTH_URL?.replace(":3001", ":5173") || "http://localhost:5173";
const TOKEN_SECRET = process.env.BETTER_AUTH_SECRET || "compsphere-battle-royale-email-secret";

interface EmailPayload {
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  emailType: "SLOT_CONFIRMATION" | "GENERAL_INFO";
  team: {
    id: string;
    teamName: string;
    teamCode: string;
    category: string;
    rank: number;
  };
  deadlineHours?: number;
}

export interface GeneratedActionTokens {
  claimToken: string;
  rejectToken: string;
  claimUrl: string;
  rejectUrl: string;
  directResponseUrl: string;
}

export class EmailService {
  /**
   * Helper to check if real email delivery provider is configured
   */
  public isConfigured(): boolean {
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });
    dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    return hasSmtp || hasResend;
  }

  private getTransporter(): Transporter | null {
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });
    dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    if (host && user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }

    return null;
  }

  /**
   * Generates a tamper-proof signed action token for a team
   */
  public generateTokens(teamId: string, teamCode: string, hoursValid = 72): GeneratedActionTokens {
    const expiresAt = Date.now() + hoursValid * 60 * 60 * 1000;

    const createToken = (action: "CLAIM" | "REJECT" | "VIEW") => {
      const payload = `${teamId}:${teamCode}:${action}:${expiresAt}`;
      const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
      return Buffer.from(`${payload}:${signature}`).toString("base64url");
    };

    const claimToken = createToken("CLAIM");
    const rejectToken = createToken("REJECT");
    const viewToken = createToken("VIEW");

    return {
      claimToken,
      rejectToken,
      claimUrl: `${APP_URL}/battle-royale/response?token=${claimToken}&action=CLAIM`,
      rejectUrl: `${APP_URL}/battle-royale/response?token=${rejectToken}&action=REJECT`,
      directResponseUrl: `${APP_URL}/battle-royale/response?token=${viewToken}`,
    };
  }

  /**
   * Verifies an action token and extracts data
   */
  public verifyToken(token: string): {
    valid: boolean;
    teamId?: string;
    teamCode?: string;
    action?: "CLAIM" | "REJECT" | "VIEW";
    expired?: boolean;
  } {
    try {
      const raw = Buffer.from(token, "base64url").toString("utf-8");
      const parts = raw.split(":");
      if (parts.length !== 5) return { valid: false };

      const [teamId, teamCode, action, expStr, signature] = parts;
      const expectedPayload = `${teamId}:${teamCode}:${action}:${expStr}`;
      const expectedSignature = crypto.createHmac("sha256", TOKEN_SECRET).update(expectedPayload).digest("hex");

      if (signature !== expectedSignature) {
        return { valid: false };
      }

      const exp = Number(expStr);
      if (Date.now() > exp) {
        return { valid: false, expired: true, teamId, teamCode, action: action as any };
      }

      return {
        valid: true,
        teamId,
        teamCode,
        action: action as any,
      };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Replace email template placeholders with team values
   */
  public renderTemplate(template: string, data: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.split(`{{${key}}}`).join(value || "");
    }
    return result;
  }

  /**
   * Builds high-aesthetic HTML email with wide responsive layout & hero section typography
   */
  private buildHtmlEmail(payload: EmailPayload, tokens: GeneratedActionTokens): string {
    const isSlotConfirmation = payload.emailType === "SLOT_CONFIRMATION";
    const isTop30 = payload.team.rank <= 30;
    const paymentNotice =
      payload.team.category === "INTERNATIONAL"
        ? "Registration Fee: FREE (International Category)"
        : "Registration Fee: Rp 120,000 (Payment required upon slot confirmation)";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.subject}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');
    body { margin: 0; padding: 0; background-color: #080a0f; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .container { max-width: 680px; width: 100%; margin: 0 auto; padding: 20px 14px; }
    .card { background-color: #111520; border: 1px solid #1f273b; border-radius: 12px; padding: 28px 32px; box-shadow: 0 12px 30px rgba(0,0,0,0.6); }
    h1 { color: #ffffff; font-size: 19px; font-weight: 700; margin: 0 0 14px 0; line-height: 1.35; letter-spacing: -0.2px; }
    p { font-size: 13.5px; line-height: 1.6; color: #cbd5e1; margin: 0 0 14px 0; }
    .team-badge-box { background-color: #0b0e16; border: 1px solid #1a2234; border-radius: 8px; padding: 14px 18px; margin: 18px 0; }
    .btn-claim, a.btn-claim, a.btn-claim:visited, a.btn-claim:hover, a.btn-claim:active {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 12px 26px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.3px;
      margin: 4px 6px;
    }
    .btn-reject, a.btn-reject, a.btn-reject:visited, a.btn-reject:hover, a.btn-reject:active {
      display: inline-block;
      background-color: #232c3d;
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 12px 22px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.3px;
      margin: 4px 6px;
      border: 1px solid #37445c;
    }
    .btn-portal, a.btn-portal, a.btn-portal:visited, a.btn-portal:hover, a.btn-portal:active {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 11px 24px;
      border-radius: 7px;
      font-weight: 700;
      font-size: 13px;
    }
    .notice { font-size: 11.5px; color: #64748b; border-top: 1px solid #1a2234; padding-top: 16px; margin-top: 20px; text-align: center; line-height: 1.5; }
    .footer { text-align: center; font-size: 11px; color: #475569; margin-top: 18px; letter-spacing: 0.2px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <!-- Hero Header Branding -->
      <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #1a2234; margin-bottom: 20px;">
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #ffffff; line-height: 1.1; margin: 0 0 4px 0;">
          COMPSPHERE <span style="color: #00f5c8;">12</span>
        </div>
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #94a3b8;">
          INTERNATIONAL <span style="color: #00f5c8;">WEB3</span> HACKATHON
        </div>
      </div>
      
      <h1>${payload.subject}</h1>
      
      <div style="font-size: 13.5px; line-height: 1.65; color: #cbd5e1; white-space: pre-line; margin-bottom: 16px;">
        ${payload.body}
      </div>

      <!-- Compact Team Verification Grid -->
      <div class="team-badge-box">
        <div style="font-size: 10px; font-weight: 800; color: #00f5c8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
          Team Verification Details
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <tr>
            <td style="padding: 4px 8px 4px 0; color: #64748b; width: 22%;">Team Name:</td>
            <td style="padding: 4px 8px; color: #f8fafc; font-weight: 600; width: 28%;">${payload.team.teamName}</td>
            <td style="padding: 4px 8px; color: #64748b; width: 20%;">Category:</td>
            <td style="padding: 4px 0 4px 8px; color: #f8fafc; font-weight: 600; width: 30%;">${payload.team.category}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px 4px 0; color: #64748b;">Team Code:</td>
            <td style="padding: 4px 8px; color: #f8fafc; font-family: monospace; font-weight: 600;">${payload.team.teamCode}</td>
            <td style="padding: 4px 8px; color: #64748b;">Status:</td>
            <td style="padding: 4px 0 4px 8px; color: #00f5c8; font-weight: 700;">${isTop30 ? "Phase 2 Finalist (Qualified)" : "Waiting List Pool"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px 2px 0; color: #64748b; font-size: 11.5px;" colspan="1">Fee Note:</td>
            <td style="padding: 6px 0 2px 8px; color: #94a3b8; font-size: 11.5px;" colspan="3">${paymentNotice}</td>
          </tr>
        </table>
      </div>

      ${
        isSlotConfirmation
          ? `
      <div style="text-align: center; margin: 20px 0 12px 0;">
        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">
          Please confirm your participation status for Phase 2:
        </p>
        <div style="margin: 12px 0;">
          <a href="${tokens.claimUrl}" class="btn-claim" style="color: #ffffff !important; text-decoration: none !important;">
            <span style="color: #ffffff !important; font-weight: 700; text-decoration: none !important;">✓ Claim &amp; Confirm Slot</span>
          </a>
          <a href="${tokens.rejectUrl}" class="btn-reject" style="color: #ffffff !important; text-decoration: none !important;">
            <span style="color: #ffffff !important; font-weight: 600; text-decoration: none !important;">✕ Decline / Reject Slot</span>
          </a>
        </div>
        <p style="font-size: 11px; color: #64748b; margin-top: 10px; margin-bottom: 0;">
          Or review full details at: <a href="${tokens.directResponseUrl}" style="color: #38bdf8; text-decoration: none;">${tokens.directResponseUrl}</a>
        </p>
      </div>
      `
          : `
      <div style="text-align: center; margin: 18px 0 10px 0;">
        <a href="${APP_URL}" class="btn-portal" style="color: #ffffff !important; text-decoration: none !important;">
          <span style="color: #ffffff !important; font-weight: 700; text-decoration: none !important;">Visit CompSphere Portal →</span>
        </a>
      </div>
      `
      }

      <div class="notice">
        This is an official automated notification from the CompSphere 12 Organizing Committee.<br>
        If you have questions, reply directly to this email or contact support.
      </div>
    </div>
    
    <div class="footer">
      © ${new Date().getFullYear()} CompSphere 12 — President University. All rights reserved.
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send email using Resend API directly if configured
   */
  private async sendViaResend(
    to: string,
    from: string,
    subject: string,
    html: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) return { success: false, error: "No RESEND_API_KEY" };

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
        }),
      });

      const json: any = await response.json();
      if (!response.ok) {
        return { success: false, error: json.message || "Resend API error" };
      }

      return { success: true, id: json.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Send single email to team leader (via SMTP, Resend, or fallback simulation)
   */
  public async sendTeamEmail(payload: EmailPayload): Promise<{
    success: boolean;
    isRealDelivery: boolean;
    messageId?: string;
    tokens: GeneratedActionTokens;
    preview?: string;
    error?: string;
  }> {
    const tokens = this.generateTokens(payload.team.id, payload.team.teamCode, payload.deadlineHours || 72);

    const renderedBody = this.renderTemplate(payload.body, {
      team_name: payload.team.teamName,
      team_code: payload.team.teamCode,
      category: payload.team.category,
      rank: String(payload.team.rank),
      leader_name: payload.recipientName,
      claim_url: tokens.claimUrl,
      reject_url: tokens.rejectUrl,
      direct_url: tokens.directResponseUrl,
    });

    const renderedSubject = this.renderTemplate(payload.subject, {
      team_name: payload.team.teamName,
      team_code: payload.team.teamCode,
      rank: String(payload.team.rank),
    });

    const html = this.buildHtmlEmail(
      {
        ...payload,
        subject: renderedSubject,
        body: renderedBody,
      },
      tokens
    );

    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || "CompSphere 12 <noreply@compsphere12.id>";

    // 1. Try Resend API if configured
    if (process.env.RESEND_API_KEY && payload.to) {
      const resendRes = await this.sendViaResend(payload.to, fromAddress, renderedSubject, html);
      if (resendRes.success) {
        console.log(`[EmailService:Resend] Sent to ${payload.to} (${payload.team.teamName})`);
        return {
          success: true,
          isRealDelivery: true,
          messageId: resendRes.id,
          tokens,
        };
      } else {
        console.warn(`[EmailService:Resend] Error sending to ${payload.to}: ${resendRes.error}`);
      }
    }

    // 2. Try SMTP if configured
    const transporter = this.getTransporter();
    if (transporter && payload.to) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: payload.to,
          subject: renderedSubject,
          text: renderedBody,
          html,
        });

        console.log(`[EmailService:SMTP] Sent to ${payload.to} (${payload.team.teamName}), messageId: ${info.messageId}`);
        return {
          success: true,
          isRealDelivery: true,
          messageId: info.messageId,
          tokens,
        };
      } catch (err: any) {
        console.error(`[EmailService:SMTP] Error sending to ${payload.to}:`, err.message);
        return {
          success: false,
          isRealDelivery: false,
          tokens,
          error: err.message,
          preview: `[SMTP ERROR] ${err.message}`,
        };
      }
    }

    // 3. Fallback simulation (when no SMTP / Resend in .env)
    console.log(
      `[EmailService:Simulated] (No SMTP/Resend configured in .env) Target: ${payload.to || "No Email"} | Team: ${payload.team.teamName} | Subject: ${renderedSubject}`
    );

    return {
      success: true,
      isRealDelivery: false,
      tokens,
      preview: `[SIMULATED] Email recorded for ${payload.to || payload.team.teamName}`,
    };
  }
}

export const emailService = new EmailService();
