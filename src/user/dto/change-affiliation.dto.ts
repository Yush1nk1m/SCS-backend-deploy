import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ChangeAffiliationDto {
    @ApiProperty({
        example: "서강대학교",
        description: "사용자의 새로운 소속",
    })
    @IsString()
    @IsNotEmpty()
    affiliation: string;
}
