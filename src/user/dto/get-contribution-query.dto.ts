import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { ContributionType } from "../types/contribution.enum";

export class GetContributionQueryDto {
    @ApiProperty({ required: true })
    @IsEnum(ContributionType)
    type: ContributionType;
}
