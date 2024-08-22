import { ThrottlerModuleOptions } from "@nestjs/throttler";

export const ThrottlerConfig: ThrottlerModuleOptions = [
    {
        ttl: 60,
        limit: 60,
    },
];
