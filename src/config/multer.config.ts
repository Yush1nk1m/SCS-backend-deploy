import { BadRequestException } from "@nestjs/common";
import { MulterModuleOptions } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

export const MulterConfig: MulterModuleOptions = {
    storage: memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif)$/)) {
            return callback(
                new BadRequestException("Only image files can be uploaded."),
                false,
            );
        }
        callback(null, true);
    },
};
