import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

const getTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    pool: true,
    socketTimeout: 10000
});

// @route   POST /api/contact
router.post('/', (req, res) => {
    const { identity, email, visionDetails } = req.body;

    if (!identity || !email || !visionDetails) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Respond immediately — client never waits for email
    res.status(200).json({ message: "Your vision is shared — we'll be connecting with you soon!" });

    // 🔥 Fire-and-forget email in background
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;
    const RECEIVER   = process.env.CONTACT_RECEIVER || 'houseofvisuals.in@gmail.com';

    if (!EMAIL_USER || !EMAIL_PASS) {
        console.log(`[Contact] No SMTP — Name: ${identity} | Email: ${email}`);
        return;
    }

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#d4af37,#b8962c);padding:24px 32px;">
                <h1 style="margin:0;color:#000;font-size:20px;">🔔 New Discovery Session Request</h1>
                <p style="margin:6px 0 0;color:#000;opacity:0.7;font-size:13px;">via houseofvisuals.co.in</p>
            </div>
            <div style="padding:28px 32px;">
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#64748b;font-size:13px;width:100px;">NAME</td>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#fff;font-weight:600;">${identity}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0;color:#64748b;font-size:13px;">EMAIL</td>
                        <td style="padding:10px 0;"><a href="mailto:${email}" style="color:#d4af37;">${email}</a></td>
                    </tr>
                </table>
                <div style="margin-top:20px;">
                    <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">MESSAGE</p>
                    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;line-height:1.7;white-space:pre-wrap;">${visionDetails}</div>
                </div>
                <div style="margin-top:20px;text-align:right;">
                    <a href="mailto:${email}?subject=Re: Your Discovery Session Request" style="display:inline-block;padding:10px 22px;background:linear-gradient(135deg,#d4af37,#b8962c);color:#000;font-weight:700;text-decoration:none;border-radius:8px;font-size:13px;">
                        ↩ Reply to ${identity}
                    </a>
                </div>
            </div>
            <div style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.06);color:#334155;font-size:11px;text-align:center;">
                House of Visuals · houseofvisuals.co.in
            </div>
        </div>
    `;

    getTransporter().sendMail({
        from: `"House of Visuals" <${EMAIL_USER}>`,
        to: RECEIVER,
        replyTo: email,
        subject: `✨ New Discovery Request from ${identity}`,
        text: `Name: ${identity}\nEmail: ${email}\n\nMessage:\n${visionDetails}`,
        html
    }).then(() => {
        console.log(`[Contact] Email sent — ${identity} <${email}>`);
    }).catch(err => {
        console.error('[Contact] Email failed:', err.message);
    });
});

export default router;
