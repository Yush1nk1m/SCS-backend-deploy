import { ApiProperty } from "@nestjs/swagger";
import { WriterDto } from "../../user/dto/writer.dto";
import { Expose } from "class-transformer";

export class CommentDto {
    @ApiProperty({ example: 1, description: "댓글 고유 ID" })
    @Expose()
    id: number;

    @ApiProperty({
        example: "이 게시물은 큰 도움이 되었습니다 ...",
        description: "댓글 내용",
    })
    @Expose()
    content: string;

    @ApiProperty({
        example: "2024-08-14T12:34:56Z",
        description: "댓글 작성 일시",
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        example: "2024-08-14T12:34:56Z",
        description: "댓글 수정 일시",
    })
    @Expose()
    updatedAt: Date;

    @ApiProperty({ type: WriterDto })
    @Expose()
    writer: WriterDto;
}
