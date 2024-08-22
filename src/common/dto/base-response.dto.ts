import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class BaseResponseDto {
    @ApiProperty({
        example: "Request has been processed.",
        description: "응답 메시지",
    })
    @Expose()
    message: string;
}
