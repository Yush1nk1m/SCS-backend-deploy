import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../types/jwt-payload.type";
import * as path from "path";
import { config } from "dotenv";
config({
    path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
});
@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_ACCESS_SECRET,
        });
    }

    validate(payload: JwtPayload) {
        return payload;
    }
}
