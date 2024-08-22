import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MailerModule } from "@nestjs-modules/mailer";
import { mailerConfig } from "src/config/mailer.config";
import { JwtModule } from "@nestjs/jwt";
import { AccessTokenStrategy } from "./strategies/access-token.strategy";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy";

@Module({
    imports: [
        MailerModule.forRootAsync(new mailerConfig()),
        JwtModule.register({}),
    ],
    controllers: [AuthController],
    providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
    exports: [AuthService],
})
export class AuthModule {}
