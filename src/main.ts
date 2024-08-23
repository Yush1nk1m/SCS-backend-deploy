import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { AllExceptionFilter } from "./common/filter/all-exception.filter";
import {
    initializeTransactionalContext,
    StorageDriver,
} from "typeorm-transactional";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { DtoInterceptor } from "./common/interceptor/dto.interceptor";
import helmet from "helmet";
import * as fs from "fs";
import * as path from "path";
import * as compression from "compression";
import { config } from "dotenv";
config({ path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`) });

async function bootstrap() {
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.use(helmet());
    app.use(compression());

    app.enableCors({
        origin: [
            "https://scsdevs.com",
            "https://www.scsdevs.com",
            "http://localhost:5173",
        ],
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
    });

    app.useGlobalFilters(new AllExceptionFilter());

    app.useGlobalInterceptors(new DtoInterceptor(app.get(Reflector)));

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    // const swaggerConfig = new DocumentBuilder()
    //     .addBearerAuth()
    //     .setTitle("SCS API")
    //     .setDescription("Study Computer Science 서비스의 백엔드 API 문서이다.")
    //     .setVersion("1.0")
    //     .build();
    // const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    // SwaggerModule.setup("api", app, swaggerDocument);
    // fs.writeFileSync("./swagger.json", JSON.stringify(swaggerDocument));

    await app.listen(4000);
}
bootstrap();
