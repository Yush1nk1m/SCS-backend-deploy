import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateCommentDto {
    @ApiProperty({ example: 2, description: "댓글이 작성되는 액션의 고유 ID" })
    @IsInt()
    actionId: number;

    @ApiProperty({
        example: "이 게시물은 큰 도움이 되었습니다 ...",
        description: "댓글 내용",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    content: string;
}
