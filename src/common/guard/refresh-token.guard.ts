import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import * as jwt from "jsonwebtoken";
export class RefreshTokenGuard extends AuthGuard("jwt-refresh") {
    constructor() {
        super();
    }

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new UnauthorizedException("No token found.");
        }

        const token = authHeader.replace("Bearer ", "").trim();
        try {
            const decoded = jwt.decode(token);
            if (typeof decoded === "object" && decoded["exp"]) {
                const currentTime = Math.floor(Date.now() / 1000);
                if (decoded["exp"] < currentTime) {
                    throw new UnauthorizedException("Token has been expired.");
                }
            }
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            throw new UnauthorizedException(
                "Token is invalid or has been expired.",
            );
        }

        return super.canActivate(context);
    }
}
