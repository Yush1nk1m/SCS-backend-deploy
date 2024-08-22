import {
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { UploadedFile } from "./types/uploaded-file.type";
import * as path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { UserRepository } from "../repository/user.repository";
import { config } from "dotenv";
config({
    path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
});

@Injectable()
export class UploadService {
    private logger = new Logger("UploadService");
    private readonly bucketName = process.env.AWS_S3_BUCKET_NAME;

    constructor(
        private readonly s3Client: S3Client,
        private readonly userRepository: UserRepository,
    ) {}

    private generateFileName(originalname: string): string {
        return `${new Date().getTime()}${uuidv4()}${path.extname(originalname).toLowerCase()}`;
    }

    // [UP-01] Service logic
    // server receives file from the client and upload it to S3 bucket
    async uploadImage(
        userId: number,
        file: Express.Multer.File,
    ): Promise<UploadedFile> {
        // find user from DB
        const user = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        // generate filename with timestamp
        const filename = this.generateFileName(file.originalname);

        // create put command to send image file to S3 bucket
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: filename,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        try {
            // upload file to S3 bucket and return URL
            await this.s3Client.send(command);
            const url = `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
            return { url };
        } catch (error) {
            this.logger.error(`S3 upload error: ${error.message}`, error.stack);
            throw new InternalServerErrorException(
                "Failed to upload file to S3",
            );
        }
    }

    // [UP-02] Service logic
    // Sign URL and return it to the client to allow them to upload directly
    async getPresignedUrl(key: string): Promise<string> {
        // create command to upload file to S3 bucket
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
        });

        return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    }
}
