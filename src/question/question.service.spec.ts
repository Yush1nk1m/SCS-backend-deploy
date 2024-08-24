import { Test, TestingModule } from "@nestjs/testing";
import { QuestionService } from "./question.service";
import { QuestionRepository } from "../repository/question.repository";
import { UserRepository } from "../repository/user.repository";
import { SectionRepository } from "../repository/section.repository";
import { ActionRepository } from "../repository/action.repository";
import { faker } from "@faker-js/faker";
import { Question } from "./question.entity";
import { User } from "../user/user.entity";
import { Section } from "../section/section.entity";
import { Action } from "../action/action.entity";

// mock @Transactional() decorator
jest.mock("typeorm-transactional", () => ({
    Transactional: jest.fn().mockImplementation(() => {
        return function (
            target,
            propertyKey: string,
            descriptor: PropertyDescriptor,
        ) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: unknown[]) {
                return originalMethod.apply(this, args);
            };
            return descriptor;
        };
    }),
    IsolationLevel: {
        REPEATABLE_READ: "REPEATABLE_READ",
    },
}));

describe("QuestionService", () => {
    let questionService: QuestionService;
    let questionRepository: QuestionRepository;
    let userRepository: UserRepository;
    let sectionRepository: SectionRepository;
    let actionRepository: ActionRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionService,
                {
                    provide: QuestionRepository,
                    useValue: {
                        findQuestionById: jest.fn(),
                        createQuestion: jest.fn(),
                        save: jest.fn(),
                        deleteQuestionById: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findUserById: jest.fn(),
                    },
                },
                {
                    provide: SectionRepository,
                    useValue: {
                        findSectionById: jest.fn(),
                    },
                },
                {
                    provide: ActionRepository,
                    useValue: {
                        findActionsByQuestionId: jest.fn(),
                    },
                },
            ],
        }).compile();

        questionService = module.get<QuestionService>(QuestionService);
        questionRepository = module.get<QuestionRepository>(QuestionRepository);
        userRepository = module.get<UserRepository>(UserRepository);
        sectionRepository = module.get<SectionRepository>(SectionRepository);
        actionRepository = module.get<ActionRepository>(ActionRepository);
    });

    it("should be defined", () => {
        expect(questionService).toBeDefined();
        expect(questionRepository).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(sectionRepository).toBeDefined();
        expect(actionRepository).toBeDefined();
    });

    describe("[S-Q-01] QuestionService.getSpecificQuestion()", () => {
        // Given
        const questionId = faker.number.int();

        it("[S-Q-01-01] Success", async () => {
            // Given
            const question = new Question();
            const mockedFindQuestionById = jest
                .spyOn(questionRepository, "findQuestionById")
                .mockResolvedValueOnce(question);

            // When
            const result =
                await questionService.getSpecificQuestion(questionId);

            // Then
            expect(result).toEqual(question);
            expect(mockedFindQuestionById).toHaveBeenCalledTimes(1);
            expect(mockedFindQuestionById).toHaveBeenCalledWith(questionId);
        });
    });

    describe("[S-Q-02] QuestionService.createQuestion()", () => {
        // Given
        const userId = faker.number.int();
        const sectionId = faker.number.int();
        const content = faker.lorem.sentence();

        it("[S-Q-02-01] Success", async () => {
            // Given
            const user = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(user);

            const section = new Section();
            const mockedFindSectionById = jest
                .spyOn(sectionRepository, "findSectionById")
                .mockResolvedValueOnce(section);

            const question = new Question();
            const mockedCreateQuestion = jest
                .spyOn(questionRepository, "createQuestion")
                .mockResolvedValueOnce(question);

            // When
            const result = await questionService.createQuestion(
                userId,
                sectionId,
                content,
            );

            // Then
            expect(result).toEqual(question);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedFindSectionById).toHaveBeenCalledTimes(1);
            expect(mockedFindSectionById).toHaveBeenCalledWith(sectionId);
            expect(mockedCreateQuestion).toHaveBeenCalledTimes(1);
            expect(mockedCreateQuestion).toHaveBeenCalledWith(
                user,
                section,
                content,
            );
        });
    });

    describe("[S-Q-03] QuestionService.updateQuestionContent()", () => {
        // Given
        const questionId = faker.number.int();
        const content = faker.lorem.sentence();

        it("[S-Q-03-01] Success", async () => {
            // Given
            const question = new Question();
            const mockedFindQuestionById = jest
                .spyOn(questionRepository, "findQuestionById")
                .mockResolvedValueOnce(question);

            const mockedSave = jest
                .spyOn(questionRepository, "save")
                .mockResolvedValueOnce(question);

            // When
            const result = await questionService.updateQuestionContent(
                questionId,
                content,
            );

            // Then
            expect(result).toEqual(question);
            expect(result.content).toBe(content);
            expect(mockedFindQuestionById).toHaveBeenCalledTimes(1);
            expect(mockedFindQuestionById).toHaveBeenCalledWith(questionId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(question);
        });
    });

    describe("[S-Q-04] QuestionService.deleteQuestion()", () => {
        // Given
        const questionId = faker.number.int();

        it("[S-Q-04-01] Success", async () => {
            // Given
            const question = new Question();
            const mockedFindQuestionById = jest
                .spyOn(questionRepository, "findQuestionById")
                .mockResolvedValueOnce(question);

            const mockedDeleteQuestionById = jest
                .spyOn(questionRepository, "deleteQuestionById")
                .mockResolvedValueOnce();

            // When
            const result = await questionService.deleteQuestion(questionId);

            // Then
            expect(result).toBeUndefined();
            expect(mockedFindQuestionById).toHaveBeenCalledTimes(1);
            expect(mockedFindQuestionById).toHaveBeenCalledWith(questionId);
            expect(mockedDeleteQuestionById).toHaveBeenCalledTimes(1);
            expect(mockedDeleteQuestionById).toHaveBeenCalledWith(questionId);
        });
    });

    describe("[S-Q-05] QuestionService.getActionsByQuestion()", () => {
        // Given
        const questionId = faker.number.int();
        const page = faker.number.int();
        const limit = faker.number.int();
        const sort = "likeCount";
        const order = "ASC";
        const search = faker.lorem.word();

        it("[S-Q-05-01] Success", async () => {
            // Given
            const question = new Question();
            const mockedFindQuestionById = jest
                .spyOn(questionRepository, "findQuestionById")
                .mockResolvedValueOnce(question);

            const actions = [new Action(), new Action(), new Action()];
            const total = actions.length;
            const mockedFindActionsByQuestionId = jest
                .spyOn(actionRepository, "findActionsByQuestionId")
                .mockResolvedValueOnce([actions, total]);

            // When
            const result = await questionService.getActionsByQuestion(
                questionId,
                page,
                limit,
                sort,
                order,
                search,
            );

            // Then
            expect(result).toEqual([actions, total]);
            expect(mockedFindQuestionById).toHaveBeenCalledTimes(1);
            expect(mockedFindQuestionById).toHaveBeenCalledWith(questionId);
            expect(mockedFindActionsByQuestionId).toHaveBeenCalledTimes(1);
            expect(mockedFindActionsByQuestionId).toHaveBeenCalledWith(
                questionId,
                page,
                limit,
                sort,
                order,
                search,
            );
        });
    });
});
