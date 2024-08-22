import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { BookVisibility } from "../types/book-visibility.type";

export class UpdateBookDto {
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

export class UpdateBookVisibilityDto {
    @ApiProperty({
        enum: BookVisibility,
        example: "public",
        description: "문제집 공개 범위",
    })
    @IsEnum(BookVisibility)
    visibility: BookVisibility;
}
