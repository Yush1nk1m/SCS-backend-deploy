import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { BaseResponseDto } from "./base-response.dto";

export class LikeResponseDto extends BaseResponseDto {
    @ApiProperty({ example: 10, description: "좋아요 수" })
    @Expose()
    likeCount: number;

    @ApiProperty({
        example: false,
        description: "사용자의 좋아요 여부 (결과)",
    })
    @Expose()
    liked: boolean;
}
