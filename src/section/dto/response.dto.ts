import { ApiProperty } from "@nestjs/swagger";
import { BaseResponseDto } from "../../common/dto/base-response.dto";
import { SectionDto } from "./section.dto";
import { Expose, Type } from "class-transformer";

export class SectionsResponseDto extends BaseResponseDto {
    @ApiProperty({ type: [SectionDto] })
    @Type(() => SectionDto)
    @Expose()
    sections: SectionDto[];
}

export class SectionResponseDto extends BaseResponseDto {
    @ApiProperty({ type: SectionDto })
    @Type(() => SectionDto)
    @Expose()
    section: SectionDto;
}
