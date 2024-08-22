import { ApiProperty } from "@nestjs/swagger";
import { WriterDto } from "../../user/dto/writer.dto";
import { Expose, Type } from "class-transformer";

export class QuestionDto {
    @ApiProperty({ example: 1, description: "질문 ID" })
    @Expose()
    id: number;

    @ApiProperty({
        example: "TCP와 UDP의 차이점은 무엇인가요?",
        description: "질문 내용",
    })
    @Expose()
    content: string;

    @ApiProperty({ example: 5, description: "질문이 스크랩된 횟수" })
    @Expose()
    saved: number;

    @ApiProperty({
        example: "2024-08-14T12:34:56Z",
        description: "질문 생성 일시",
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        example: "2024-08-14T12:34:56Z",
        description: "질문 수정 일시",
    })
    @Expose()
    updatedAt: Date;

    @ApiProperty({ type: () => WriterDto })
    @Type(() => WriterDto)
    @Expose()
    writer: WriterDto;
}
