import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class DeleteUserDto {
    @ApiProperty({
        example: "password123",
        description: "사용자 비밀번호 (8-32자)",
    })
    @Length(8, 32)
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        example: "회원 탈퇴를 희망합니다.",
        description: "회원 탈퇴를 위한 확인 메시지",
    })
    @IsString()
    @IsNotEmpty()
    confirmMessage: string;
}
