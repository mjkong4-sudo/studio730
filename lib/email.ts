import nodemailer from "nodemailer"

// Create a transporter - for development, we'll use a test account
// For production, configure with your SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    : undefined,
})

export async function sendVerificationEmail(email: string, url: string) {
  // In development without SMTP configured, just log the link
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("\n" + "=".repeat(60))
    console.log("📧 MAGIC LINK (Development Mode)")
    console.log("=".repeat(60))
    console.log(`Email: ${email}`)
    console.log(`Link: ${url}`)
    console.log("=".repeat(60) + "\n")
    return { success: true, messageId: "console-log" }
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@studio730.com",
    to: email,
    subject: "Sign in to Studio 730",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Studio 730</h1>
        <p>Click the link below to sign in to your account:</p>
        <p>
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Sign In
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours. If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    `,
    text: `Sign in to Studio 730: ${url}`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    // Fallback to console log if email fails
    console.log("\n" + "=".repeat(60))
    console.log("📧 MAGIC LINK (Email failed, showing here)")
    console.log("=".repeat(60))
    console.log(`Email: ${email}`)
    console.log(`Link: ${url}`)
    console.log("=".repeat(60) + "\n")
    return { success: true, messageId: "console-log-fallback" }
  }
}

