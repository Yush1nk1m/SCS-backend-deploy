import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "../../auth/types/jwt-payload.type";

export const GetCurrentUserId = createParamDecorator(
    (_: undefined, context: ExecutionContext): number | undefined => {
        const request = context.switchToHttp().getRequest();
        const user = request?.user as JwtPayload;
        return user?.sub;
    },
);
