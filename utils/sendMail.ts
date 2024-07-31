import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import dotenv from "dotenv";
import path from "path";
import ejs from "ejs";

dotenv.config();

interface iMailOptions {
  to: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

export const sendMail = async (options: iMailOptions) => {
  const transporter: Transporter<SMTPTransport.SentMessageInfo> =
    nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    } as SMTPTransport.Options);

  const { to, subject, template, data } = options;

  const templatePath = path.join(__dirname, "../mails", template);
  const html: string = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
