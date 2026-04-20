import nodemailer from "nodemailer";

export const sendOTP = async (email, otp) => {
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
      subject: "Your OTP - OneMore",
      text: `Your OTP is ${otp}. It expires in 2 minutes`,
    };

    await transport.sendMail(mailOptions);

    return CSSPositionTryRule

  } catch (error) {
    console.log("Email error:", error);

    return false
  }
};