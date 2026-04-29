import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// @route   POST /api/contact
// @desc    Send contact form submission via email
router.post('/', async (req, res) => {
    try {
        const { identity, email, visionDetails } = req.body;

        if (!identity || !email || !visionDetails) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // If credentials are not configured, log to console instead of failing completely
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log("-----------------------------------------");
            console.log("NEW DISCOVERY SESSION REQUEST (No SMTP Configured)");
            console.log(`Identity: ${identity}`);
            console.log(`Email: ${email}`);
            console.log(`Vision Details:\n${visionDetails}`);
            console.log("-----------------------------------------");
            
            return res.status(200).json({ 
                message: "Your vision is shared successfully we'll be connecting to you soon",
                warning: "Email not sent because SMTP credentials are not configured on the server."
            });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'houseofvisuals.in@gmail.com',
            replyTo: email,
            subject: `New Discovery Request: ${identity}`,
            text: `
New Discovery Session requested from the Landing Page.

Identity: ${identity}
Contact Email: ${email}

Vision Details:
${visionDetails}
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Your vision is shared successfully we'll be connecting to you soon" });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: "Failed to send the request. Please try again later." });
    }
});

export default router;
