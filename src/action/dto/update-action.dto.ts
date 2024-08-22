import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateActionDto {
    @ApiProperty({
        example: "관리자님이 2024. 08. 14. 작성한 답변입니다.",
        description: "답변 제목",
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        example: "TCP는 연결 지향적이고...",
        description: "답변 내용",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100000)
    content: string;
}
