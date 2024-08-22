import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "../../common/dto/base-response.dto";
import { Expose } from "class-transformer";

export class URLResponseDto extends BaseResponseDto {
    @ApiProperty({
        example: "s3://aws.amazon.com/...",
        description: "업로드된 이미지의 URL",
    })
    @Expose()
    url: string;
}

export class PresignedURLResponseDto extends BaseResponseDto {
    @ApiProperty({
        example: "image.png",
        description: "업로드될 이미지의 Key",
    })
    @Expose()
    key: string;

    @ApiProperty({
        example: "s3://aws.amazon.com/...",
        description: "업로드된 이미지의 URL",
    })
    @Expose()
    url: string;
}
