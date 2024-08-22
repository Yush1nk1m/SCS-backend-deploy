import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
    ClassConstructor,
    plainToClass,
    plainToInstance,
} from "class-transformer";
import { map, Observable } from "rxjs";

@Injectable()
export class DtoInterceptor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                const responseDto = this.reflector.get<
                    ClassConstructor<unknown>
                >("responseDto", context.getHandler());

                if (!responseDto) {
                    return data;
                }

                return plainToInstance(responseDto, data, {
                    excludeExtraneousValues: true,
                    enableImplicitConversion: true,
                });
            }),
        );
    }
}
