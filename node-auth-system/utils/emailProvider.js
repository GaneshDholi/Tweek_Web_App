const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
    try {
        // Create a transporter object using SMTP transport
        // For development, you can use a service like Ethereal.email
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
        };

        // Send mail with defined transport object
        const info = await transporter.sendMail(mailOptions);

        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email could not be sent.');
    }
};

module.exports = { sendEmail };