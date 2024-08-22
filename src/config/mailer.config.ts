import { MailerAsyncOptions } from "@nestjs-modules/mailer/dist/interfaces/mailer-async-options.interface";
import { EjsAdapter } from "@nestjs-modules/mailer/dist/adapters/ejs.adapter";
import * as path from "path";
import { config } from "dotenv";
config({
    path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
});

export class mailerConfig implements MailerAsyncOptions {
    useFactory = () => ({
        transport: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASS,
            },
        },
        defaults: {
            from: '"SCS" <studycomputerscienceadm1n@gmail.com>',
        },
        template: {
            dir: path.join(__dirname, "/../auth/templates"),
            adapter: new EjsAdapter(),
            options: {
                strict: false,
            },
        },
    });
}
