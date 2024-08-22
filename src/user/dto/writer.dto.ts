import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class WriterDto {
    @ApiProperty({ example: 1, description: "사용자 고유 ID" })
    @Expose()
    id: number;

    @ApiProperty({ example: "닉네임", description: "사용자 닉네임" })
    @Expose()
    nickname: string;
}
