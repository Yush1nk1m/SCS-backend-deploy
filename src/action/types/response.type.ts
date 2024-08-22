import { BaseResponse } from "../../common/types/response.type";
import { Action } from "../action.entity";

export interface ActionsResponse extends BaseResponse {
    actions: Action[];
    total: number;
}

export interface ActionResponse extends BaseResponse {
    action: Action;
}

export interface ContentResponse extends BaseResponse {
    content: string;
}

export interface LikeResponse extends BaseResponse {
    liked: boolean;
    likeCount: number;
}
