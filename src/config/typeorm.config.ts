import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as config from "config";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({
    path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
});

const dbConfig = config.get("db");

export const typeORMConfig: TypeOrmModuleOptions = {
    type: dbConfig.type,
    host: process.env.DB_HOST || dbConfig.host,
    port: process.env.DB_PORT || dbConfig.port,
    username: process.env.DB_USERNAME || dbConfig.username,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || dbConfig.database,
    entities: [__dirname + "/../**/*.entity.{js,ts}"],
    synchronize: dbConfig.synchronize,
    logging: false,
    ssl: false,
};
