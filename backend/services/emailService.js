const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp, userName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Haru Digital Wardrobe - Your OTP for Login',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Haru Digital Wardrobe</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; text-align: center;">Verify Your Login</h2>
            
            <p style="color: #666; text-align: center; margin: 20px 0;">
              Hi ${userName},
            </p>
            
            <p style="color: #666; text-align: center; margin: 20px 0;">
              Your One-Time Password (OTP) for logging into Haru Digital Wardrobe is:
            </p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea;">
                ${otp}
              </span>
            </div>
            
            <p style="color: #999; text-align: center; font-size: 12px; margin: 20px 0;">
              This OTP will expire in 10 minutes.
            </p>
            
            <p style="color: #999; text-align: center; font-size: 12px; margin: 20px 0;">
              If you did not request this OTP, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; text-align: center; font-size: 11px;">
              © 2026 Haru Digital Wardrobe. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};
