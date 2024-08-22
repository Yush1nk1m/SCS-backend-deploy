import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as path from "path";
import { config } from "dotenv";
config({
    path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
});

export const typeORMConfig: TypeOrmModuleOptions = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [__dirname + "/../**/*.entity.{js,ts}"],
    synchronize: Boolean(process.env.DB_SYNCHRONIZE),
    logging: false,
    ssl: {
        rejectUnauthorized: false,
    },
};
