import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateQuestionContentDto {
    @ApiProperty({
        example: "TCP와 UDP의 차이점은 무엇인가요?",
        description: "질문 내용",
    })
    @IsString()
    @IsNotEmpty()
    content: string;
}
