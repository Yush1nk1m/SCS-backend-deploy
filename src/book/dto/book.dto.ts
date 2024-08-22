import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { PublisherDto } from "../../user/dto/publisher.dto";

export class BookDto {
    @ApiProperty({ example: 1, description: "문제집 고유 ID" })
    @Expose()
    id: number;

    @ApiProperty({
        example: "public",
        description: "문제집 공개 범위",
    })
    @Expose()
    visibility: string;

    @ApiProperty({
        example: "백엔드 신입 면접 대비 문제집",
        description: "문제집 제목",
    })
    @Expose()
    title: string;

    @ApiProperty({
        example: "백엔드 신입 취준을 위한 문제집입니다.",
        description: "문제집 설명",
    })
    @Expose()
    description: string;

    @ApiProperty({ example: 10, description: "좋아요 수" })
    @Expose()
    likeCount: number;

    @ApiProperty({
        example: "2024-08-14T12:34:56Z",
        description: "답변 생성 일시",
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        example: "2024-08-14T12:34:56Z",
        description: "답변 수정 일시",
    })
    @Expose()
    updatedAt: Date;

    @ApiProperty({ type: PublisherDto })
    @Type(() => PublisherDto)
    @Expose()
    publisher: PublisherDto;
}
