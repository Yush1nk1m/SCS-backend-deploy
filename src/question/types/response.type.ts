import { BaseResponse } from "../../common/types/response.type";
import { Question } from "../question.entity";

export interface QuestionsResponse extends BaseResponse {
    questions: Question[];
    total: number;
}

export interface QuestionResponse extends BaseResponse {
    question: Question;
}
