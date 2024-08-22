import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { WriterDto } from "../../user/dto/writer.dto";

export class ActionDetailDto {
    @ApiProperty({ example: 1, description: "답변 고유 ID" })
    @Expose()
    id: number;

    @ApiProperty({
        example: "관리자님이 2024. 08. 14. 작성한 답변입니다.",
        description: "답변 제목",
    })
    @Expose()
    title: string;

    @ApiProperty({
        example: "TCP는 연결 지향적이고...",
        description: "답변 내용",
    })
    @Expose()
    content: string;

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

    @ApiProperty({ type: WriterDto })
    @Type(() => WriterDto)
    @Expose()
    writer: WriterDto;
}

export class ActionDto {
    @ApiProperty({ example: 1, description: "답변 ID" })
    @Expose()
    id: number;

    @ApiProperty({
        example: "관리자님이 2024. 08. 14. 작성한 답변입니다.",
        description: "답변 제목",
    })
    @Expose()
    title: string;

    @ApiPropertyOptional({
        example: ["http://example.com/image1.jpg"],
        description: "답변에 포함된 이미지 URL들",
    })
    @Expose()
    imageUrls: string[];

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

    @ApiProperty({ type: () => WriterDto })
    @Type(() => WriterDto)
    @Expose()
    writer: WriterDto;
}
