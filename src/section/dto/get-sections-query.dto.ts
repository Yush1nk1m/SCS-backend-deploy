import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

enum SortField {
    SUBJECT = "subject",
    ID = "id",
}

enum OrderType {
    ASC = "ASC",
    DESC = "DESC",
}

export class GetSectionsQueryDto {
    @ApiPropertyOptional({ enum: SortField })
    @IsEnum(SortField)
    @IsOptional()
    sort: SortField = SortField.SUBJECT;

    @ApiPropertyOptional({ enum: OrderType })
    @IsEnum(OrderType)
    @IsOptional()
    order: OrderType = OrderType.ASC;
}
