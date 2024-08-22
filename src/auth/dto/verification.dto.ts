import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class VerificationDto {
    @ApiProperty({
        example: "user@example.com",
        description: "인증할 이메일 주소",
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: "q1w2e3",
        description: "인증 코드",
    })
    @Length(6, 6)
    @IsString()
    @IsNotEmpty()
    verificationCode: string;
}
