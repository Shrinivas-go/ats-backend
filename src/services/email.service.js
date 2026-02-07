const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails for support forms and notifications
 * 
 * Note: For production, configure SMTP settings in .env
 * Development mode uses console logging as fallback
 */

// Check if email is properly configured
const isEmailConfigured = () => {
    return process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS;
};

// Create transporter (lazy initialization)
let transporter = null;

const getTransporter = () => {
    if (!transporter && isEmailConfigured()) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
};

/**
 * Send support email
 * @param {Object} data - Support form data
 * @param {string} data.name - Sender's name
 * @param {string} data.email - Sender's email
 * @param {string} data.subject - Email subject
 * @param {string} data.message - Message content
 */
async function sendSupportEmail(data) {
    const { name, email, subject, message } = data;

    const supportEmail = process.env.SUPPORT_EMAIL || 'support@ats-resume.com';

    const mailOptions = {
        from: `"ATS Resume Checker" <${process.env.SMTP_USER || 'noreply@ats-resume.com'}>`,
        to: supportEmail,
        replyTo: email,
        subject: `[Support] ${subject || 'New Support Request'}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">New Support Request</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>From:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
                </div>
                <div style="padding: 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #374151;">Message:</h3>
                    <p style="white-space: pre-wrap; color: #4b5563;">${message}</p>
                </div>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                    This email was sent from the ATS Resume Checker support form.
                </p>
            </div>
        `,
        text: `
New Support Request

From: ${name}
Email: ${email}
Subject: ${subject || 'General Inquiry'}

Message:
${message}

---
This email was sent from the ATS Resume Checker support form.
        `,
    };

    const transport = getTransporter();

    if (transport) {
        try {
            const result = await transport.sendMail(mailOptions);
            console.log('Support email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Email send error:', error);
            throw new Error('Failed to send email');
        }
    } else {
        // Development fallback - log to console
        console.log('=== SUPPORT EMAIL (DEV MODE) ===');
        console.log('To:', supportEmail);
        console.log('From:', `${name} <${email}>`);
        console.log('Subject:', subject || 'General Inquiry');
        console.log('Message:', message);
        console.log('================================');

        return {
            success: true,
            messageId: `dev-${Date.now()}`,
            dev: true
        };
    }
}

/**
 * Send notification email to user
 * @param {string} toEmail - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email content
 */
async function sendNotificationEmail(toEmail, subject, htmlContent) {
    const mailOptions = {
        from: `"ATS Resume Checker" <${process.env.SMTP_USER || 'noreply@ats-resume.com'}>`,
        to: toEmail,
        subject: subject,
        html: htmlContent,
    };

    const transport = getTransporter();

    if (transport) {
        try {
            const result = await transport.sendMail(mailOptions);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Notification email error:', error);
            throw new Error('Failed to send notification');
        }
    } else {
        console.log('=== NOTIFICATION EMAIL (DEV MODE) ===');
        console.log('To:', toEmail);
        console.log('Subject:', subject);
        console.log('======================================');

        return { success: true, messageId: `dev-${Date.now()}`, dev: true };
    }
}

module.exports = {
    sendSupportEmail,
    sendNotificationEmail,
    isEmailConfigured,
};
