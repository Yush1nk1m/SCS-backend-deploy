import { JwtPayload } from "./jwt-payload.type";

export type JwtRefreshPayload = JwtPayload & { refreshToken: string };
