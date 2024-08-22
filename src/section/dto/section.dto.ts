import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsInt, IsNotEmpty, IsString } from "class-validator";
import { CreatorDto } from "../../user/dto/creator.dto";
import { Expose } from "class-transformer";

export class SectionDto {
    @ApiProperty({ example: 1, description: "섹션 고유 ID" })
    @IsInt()
    @Expose()
    id: number;

    @ApiProperty({ example: "네트워크", description: "섹션 주제" })
    @IsString()
    @IsNotEmpty()
    @Expose()
    subject: string;

    @ApiPropertyOptional({
        example: "네트워크 관련 질문들",
        description: "섹션 설명",
    })
    @IsString()
    @Expose()
    description: string;

    @ApiProperty({
        example: "2024-08-14T12:34:56Z",
        description: "섹션 생성 일시",
    })
    @IsDate()
    @Expose()
    createdAt: Date;

    @ApiProperty({
        example: "2024-08-14T12:34:56Z",
        description: "섹션 수정 일시",
    })
    @IsDate()
    @Expose()
    updatedAt: Date;

    @ApiProperty({ type: CreatorDto })
    @Expose()
    creator: CreatorDto;
}
