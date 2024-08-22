import { ForbiddenException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../types/jwt-payload.type";
import { JwtRefreshPayload } from "../types/jwt-refresh-payload.type";
import { Request } from "express";
import * as path from "path";
import { config } from "dotenv";
config({
    path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
});

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    "jwt-refresh",
) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_REFRESH_SECRET,
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: JwtPayload): JwtRefreshPayload {
        const refreshToken = req
            ?.get("authorization")
            ?.replace("Bearer", "")
            .trim();

        if (!refreshToken) {
            throw new ForbiddenException(
                "Refresh token has not been correctly passed.",
            );
        }

        return {
            ...payload,
            refreshToken,
        };
    }
}
