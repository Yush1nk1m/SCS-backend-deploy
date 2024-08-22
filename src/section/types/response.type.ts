import { BaseResponse } from "../../common/types/response.type";
import { Section } from "../section.entity";

export interface SectionsResponse extends BaseResponse {
    sections: Section[];
}

export interface SectionResponse extends BaseResponse {
    section: Section;
}
