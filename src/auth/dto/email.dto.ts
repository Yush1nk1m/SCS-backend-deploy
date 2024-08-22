import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class EmailDto {
    @ApiProperty({ example: "user@example.com", description: "사용자 이메일" })
    @IsEmail()
    email: string;
}
