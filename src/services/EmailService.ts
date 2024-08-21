import logger from "../config/Logger";
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMIAL_ADDRESS,
    pass: process.env.EMAIL_APP_PASS,
  },
});

const notifyMessage = async (name: string, email: string, message: string): Promise<Object> => {

  const htmlMessage = `
    <h2>You have received a new message from your website contact form.</h2>
    <p><b>Name:</b> ${name}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Message:</b></p>
    <p>${message}</p>
  `;

  const mailOptions = {
    from: process.env.EMIAL_ADDRESS,
    to: process.env.EMAIL_NOTIFY,
    subject: `Contact form submission from ${name}`,
    html: htmlMessage,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.response}`);
  } catch (error) {
    logger.info(`Error sending email: ${error}`);
  }
  
  return {"msg": "success"};
}

export { notifyMessage };
