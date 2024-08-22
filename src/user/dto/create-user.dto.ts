import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class CreateUserDto {
    @ApiProperty({ example: "user@example.com", description: "사용자 이메일" })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: "password123",
        description: "사용자 비밀번호 (8-32자)",
    })
    @Length(8, 32)
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({ example: "닉네임", description: "사용자 닉네임" })
    @IsString()
    @IsNotEmpty()
    nickname: string;

    @ApiProperty({ example: "서강대학교", description: "사용자 소속" })
    @IsString()
    @IsNotEmpty()
    affiliation: string;

    @ApiProperty({ example: "백엔드", description: "사용자 포지션" })
    @IsString()
    @IsNotEmpty()
    position: string;
}
