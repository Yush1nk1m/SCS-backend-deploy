import { BaseResponse } from "../../common/types/response.type";
import { User } from "../user.entity";

export interface UsersResponse extends BaseResponse {
    users: User[];
}

export interface UserResponse extends BaseResponse {
    user: User;
}
