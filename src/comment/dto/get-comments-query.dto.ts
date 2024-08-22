import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";

enum SortField {
    CREATED_AT = "createdAt",
}

enum OrderType {
    ASC = "ASC",
    DESC = "DESC",
}

export class GetCommentsQueryDto {
    @ApiProperty({ required: false, default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    limit: number = 10;

    @ApiProperty({
        enum: SortField,
        required: false,
        default: SortField.CREATED_AT,
    })
    @IsEnum(SortField)
    @IsOptional()
    sort: SortField = SortField.CREATED_AT;

    @ApiProperty({ enum: OrderType, required: false, default: OrderType.DESC })
    @IsEnum(OrderType)
    @IsOptional()
    order: OrderType = OrderType.DESC;
}
