import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "../../common/dto/base-response.dto";
import { CommentDto } from "./comment.dto";
import { Expose, Type } from "class-transformer";

export class CommentsResponseDto extends BaseResponseDto {
    @ApiProperty({ type: [CommentDto] })
    @Type(() => CommentDto)
    @Expose()
    comments: CommentDto[];

    @ApiProperty({ example: 15, description: "총 댓글 개수" })
    @Expose()
    total: number;
}

export class CommentResponseDto extends BaseResponseDto {
    @ApiProperty({ type: CommentDto })
    @Expose()
    comment: CommentDto;
}
