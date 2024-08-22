import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString } from "class-validator";
import { Question } from "../question.entity";

export class CreateQuestionDto extends PickType(Question, ["content"]) {
    @ApiProperty({
        example: "TCP와 UDP의 차이점은 무엇인가요?",
        description: "질문 내용",
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ example: 1, description: "섹션 고유 ID" })
    @IsInt()
    @IsNotEmpty()
    sectionId: number;
}
