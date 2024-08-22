import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "../../common/dto/base-response.dto";
import { QuestionDto } from "./question.dto";
import { Expose, Type } from "class-transformer";

export class QuestionsResponseDto extends BaseResponseDto {
    @ApiProperty({ type: [QuestionDto] })
    @Type(() => QuestionDto)
    @Expose()
    questions: QuestionDto[];

    @ApiProperty({ example: 5, description: "검색된 질문의 총 개수" })
    @Expose()
    total: number;
}

export class QuestionResponseDto extends BaseResponseDto {
    @ApiProperty({ type: QuestionDto })
    @Type(() => QuestionDto)
    @Expose()
    question: QuestionDto;
}
