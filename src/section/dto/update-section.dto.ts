import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateSectionSubjectDto {
    @ApiProperty({ example: "네트워크", description: "섹션 주제" })
    @IsString()
    @IsNotEmpty()
    subject: string;
}

export class UpdateSectionDescriptionDto {
    @ApiPropertyOptional({
        example: "네트워크 관련 질문들",
        description: "섹션 설명",
    })
    @IsString()
    description: string;
}
