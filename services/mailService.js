import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OneMore OTP Verification",
      text: `Welcoe to OneMore! 
      Your OTP is ${otp}.
      This OTP is valid for 1 minutes.
      Do not share this code for security reasons
      - Team OneMore`,
    };

    await transport.sendMail(mailOptions);

    return true

  } catch (error) {
    console.log("Email error:", error);

    return false
  }
};