import { BaseResponse } from "../../common/types/response.type";

export interface URLResponse extends BaseResponse {
    url: string;
}

export interface PresignedURLResponse extends BaseResponse {
    url: string;
    key: string;
}
