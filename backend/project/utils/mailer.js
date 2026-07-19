import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendPasswordResetEmail(toEmail, token) {
    const link = `${process.env.FRONTEND_URL}/reset-password?code=${token}`;
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: 'Reset your password – Spanish Poker Dice',
        html: `<p>Click <a href="${link}">here</a> to reset your password.</p>
               <p>This link expires in 15 minutes. If you did not request this, ignore this email, and refrain from talking to any Nigerian princes</p>`
    });
}

export async function sendVerificationEmail(toEmail, token) {
    const link = `${process.env.FRONTEND_URL}/verify-email?code=${token}`;
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: 'Verify your email - Spanish Poker Dice',
        html: `<p>Thanks for registering! Click <a href="${link}">here</a> to verify your email.</p>
            <p>This link expires in 15 minutes</p>`
    });
}
