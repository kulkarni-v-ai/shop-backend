import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// @route   POST /api/contact
// @desc    Send contact form submission via email to HOV inbox
router.post('/', async (req, res) => {
    try {
        const { identity, email, visionDetails } = req.body;

        if (!identity || !email || !visionDetails) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const EMAIL_USER     = process.env.EMAIL_USER;
        const EMAIL_PASS     = process.env.EMAIL_PASS;
        const RECEIVER       = process.env.CONTACT_RECEIVER || 'houseofvisuals.in@gmail.com';

        // Guard: log to console if SMTP not configured (dev mode)
        if (!EMAIL_USER || !EMAIL_PASS) {
            console.log("─────────────────────────────────────────");
            console.log("NEW CONTACT REQUEST (SMTP not configured)");
            console.log(`Name:    ${identity}`);
            console.log(`Email:   ${email}`);
            console.log(`Message: ${visionDetails}`);
            console.log("─────────────────────────────────────────");

            return res.status(200).json({
                message: "Your vision is shared — we'll be connecting with you soon!",
                warning: "SMTP credentials not configured on server."
            });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });

        // HTML email body
        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #d4af37, #b8962c); padding: 24px 32px;">
                    <h1 style="margin: 0; color: #000; font-size: 22px; letter-spacing: 1px;">🔔 New Discovery Session Request</h1>
                    <p style="margin: 6px 0 0; color: #000; opacity: 0.7; font-size: 14px;">Received via houseofvisuals.co.in</p>
                </div>
                <div style="padding: 28px 32px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 13px; width: 120px;">NAME</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #fff; font-size: 15px; font-weight: 600;">${identity}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 13px;">EMAIL</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
                                <a href="mailto:${email}" style="color: #d4af37; font-size: 15px;">${email}</a>
                            </td>
                        </tr>
                    </table>
                    <div style="margin-top: 24px;">
                        <p style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px;">VISION / MESSAGE</p>
                        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px; color: #e2e8f0; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${visionDetails}</div>
                    </div>
                    <div style="margin-top: 24px; text-align: right;">
                        <a href="mailto:${email}?subject=Re: Your Discovery Session Request" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #d4af37, #b8962c); color: #000; font-weight: 700; text-decoration: none; border-radius: 8px; font-size: 14px;">
                            ↩ Reply to ${identity}
                        </a>
                    </div>
                </div>
                <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); color: #334155; font-size: 12px; text-align: center;">
                    House of Visuals · houseofvisuals.co.in
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: `"House of Visuals Contact" <${EMAIL_USER}>`,
            to: RECEIVER,
            replyTo: email,
            subject: `✨ New Discovery Request from ${identity}`,
            text: `Name: ${identity}\nEmail: ${email}\n\nMessage:\n${visionDetails}`,
            html: htmlBody
        });

        res.status(200).json({ message: "Your vision is shared — we'll be connecting with you soon!" });

    } catch (error) {
        console.error('Contact email error:', error.message);
        res.status(500).json({ message: "Failed to send the request. Please try again later." });
    }
});

export default router;
