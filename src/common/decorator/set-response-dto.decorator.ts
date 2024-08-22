import { SetMetadata } from "@nestjs/common";

export const SetResponseDto = (dto: any) => SetMetadata("responseDto", dto);
