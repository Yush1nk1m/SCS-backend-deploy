import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";
import { User } from "../user.entity";

export class ChangePasswordDto extends PickType(User, ["password"]) {
    @ApiProperty({
        example: "newpassword123",
        description: "사용자의 새로운 비밀번호",
    })
    @IsString()
    @IsNotEmpty()
    @Length(8, 32)
    newPassword: string;

    @ApiProperty({
        example: "newpassword123",
        description: "새로운 비밀번호의 확인 비밀번호",
    })
    @IsString()
    @IsNotEmpty()
    @Length(8, 32)
    confirmPassword: string;
}
