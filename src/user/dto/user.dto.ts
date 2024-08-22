import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UserDto {
    @ApiProperty({ example: 1, description: "사용자 고유 ID" })
    @Expose()
    id: number;

    @ApiProperty({ example: "user@example.com", description: "사용자 이메일" })
    @Expose()
    email: string;

    @ApiProperty({ example: "닉네임", description: "사용자 닉네임" })
    @Expose()
    nickname: string;

    @ApiProperty({ example: "서강대학교", description: "사용자 소속" })
    @Expose()
    affiliation: string;

    @ApiProperty({ example: "백엔드", description: "사용자 포지션" })
    @Expose()
    position: string;
}
