import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { BookVisibility } from "../types/book-visibility.type";
import { Transform } from "class-transformer";

export class CreateBookDto {
    @ApiProperty({
        enum: BookVisibility,
        default: BookVisibility.PUBLIC,
        description: "문제집 공개 범위",
    })
    @IsEnum(BookVisibility)
    @Transform(({ value }) => value || BookVisibility.PUBLIC)
    visibility: BookVisibility;

    @ApiProperty({
        example: "백엔드 신입 면접 대비 문제집",
        description: "문제집 제목",
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        example: "백엔드 신입 취준을 위한 문제집입니다.",
        description: "문제집 설명",
    })
    @IsString()
    description: string;
}
