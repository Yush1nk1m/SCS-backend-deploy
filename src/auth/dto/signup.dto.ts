import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SignupDto {
    @ApiProperty({ example: "user@example.com", description: "사용자 이메일" })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: "q1w2e3r4", description: "사용자 비밀번호" })
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

    @ApiProperty({
        example: "q1w2e3",
        description: "인증 코드",
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    verificationCode: string;
}
