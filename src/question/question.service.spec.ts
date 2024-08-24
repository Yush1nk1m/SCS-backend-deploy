import { Test, TestingModule } from "@nestjs/testing";
import { QuestionService } from "./question.service";
import { QuestionRepository } from "../repository/question.repository";
import { UserRepository } from "../repository/user.repository";
import { SectionRepository } from "../repository/section.repository";
import { ActionRepository } from "../repository/action.repository";

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
                    useValue: {},
                },
                {
                    provide: UserRepository,
                    useValue: {},
                },
                {
                    provide: SectionRepository,
                    useValue: {},
                },
                {
                    provide: ActionRepository,
                    useValue: {},
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

    describe("[S-Q-01] QuestionService.getSpecificQuestion()", () => {});

    describe("[S-Q-02] QuestionService.createQuestion()", () => {});

    describe("[S-Q-03] QuestionService.updateQuestionContent()", () => {});

    describe("[S-Q-04] QuestionService.deleteQuestion()", () => {});

    describe("[S-Q-05] QuestionService.getActionsByQuestion()", () => {});
});
