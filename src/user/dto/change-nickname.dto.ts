import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ChangeNicknameDto {
    @ApiProperty({
        example: "닉네임2",
        description: "사용자의 새로운 닉네임",
    })
    @IsString()
    @IsNotEmpty()
    nickname: string;
}
