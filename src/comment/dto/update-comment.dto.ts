import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateCommentDto {
    @ApiProperty({
        example: "이 게시물은 큰 도움이 되었습니다 ...",
        description: "댓글 내용",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    content: string;
}
