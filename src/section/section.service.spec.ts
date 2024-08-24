import { Test, TestingModule } from "@nestjs/testing";
import { SectionService } from "./section.service";
import { UserRepository } from "../repository/user.repository";
import { QuestionRepository } from "../repository/question.repository";
import { SectionRepository } from "../repository/section.repository";
import { Section } from "./section.entity";
import { InternalServerErrorException } from "@nestjs/common";
import { faker } from "@faker-js/faker";
import { User } from "../user/user.entity";
import { Question } from "../question/question.entity";

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

describe("SectionService", () => {
    let sectionService: SectionService;
    let sectionRepository: SectionRepository;
    let userRepository: UserRepository;
    let questionRepository: QuestionRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SectionService,
                {
                    provide: SectionRepository,
                    useValue: {
                        findAndSortAllSections: jest.fn(),
                        findSectionDetailById: jest.fn(),
                        findSectionById: jest.fn(),
                        createSection: jest.fn(),
                        save: jest.fn(),
                        deleteSection: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findUserById: jest.fn(),
                    },
                },
                {
                    provide: QuestionRepository,
                    useValue: {
                        findQuestionsBySectionId: jest.fn(),
                    },
                },
            ],
        }).compile();

        sectionService = module.get<SectionService>(SectionService);
        sectionRepository = module.get<SectionRepository>(SectionRepository);
        userRepository = module.get<UserRepository>(UserRepository);
        questionRepository = module.get<QuestionRepository>(QuestionRepository);
    });

    it("should be defined", () => {
        expect(sectionService).toBeDefined();
        expect(sectionRepository).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(questionRepository).toBeDefined();
    });

    describe("[S-S-01] SectionService.getAllSections()", () => {
        // Given
        const sort = "id";
        const order = "DESC";

        it("[S-S-01-01] Success", async () => {
            // Given
            const sections = [new Section(), new Section(), new Section()];
            const mockedFindAndSortAllSections = jest
                .spyOn(sectionRepository, "findAndSortAllSections")
                .mockResolvedValueOnce(sections);

            // When
            const result = await sectionService.getAllSections(sort, order);

            // Then
            expect(result).toEqual(sections);
            expect(mockedFindAndSortAllSections).toHaveBeenCalledTimes(1);
            expect(mockedFindAndSortAllSections).toHaveBeenCalledWith(
                sort,
                order,
            );
        });

        it("[S-S-01-02] Empty list", async () => {
            // Given
            const sections = [];
            const mockedFindAndSortAllSections = jest
                .spyOn(sectionRepository, "findAndSortAllSections")
                .mockResolvedValueOnce(sections);

            // When
            const result = await sectionService.getAllSections(sort, order);

            // Then
            expect(result).toEqual(sections);
            expect(mockedFindAndSortAllSections).toHaveBeenCalledTimes(1);
            expect(mockedFindAndSortAllSections).toHaveBeenCalledWith(
                sort,
                order,
            );
        });

        it("[S-S-01-03] Success with no query", async () => {
            // Given
            const sections = [];
            const mockedFindAndSortAllSections = jest
                .spyOn(sectionRepository, "findAndSortAllSections")
                .mockResolvedValueOnce(sections);

            // When
            const result = await sectionService.getAllSections();

            // Then
            expect(result).toEqual(sections);
            expect(mockedFindAndSortAllSections).toHaveBeenCalledTimes(1);
            expect(mockedFindAndSortAllSections).toHaveBeenCalledWith(
                "subject",
                "ASC",
            );
        });

        it("[S-S-01-04] Failed to find sections", async () => {
            // Given
            const mockedFindAndSortAllSections = jest
                .spyOn(sectionRepository, "findAndSortAllSections")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                sectionService.getAllSections(sort, order),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedFindAndSortAllSections).toHaveBeenCalledTimes(1);
            expect(mockedFindAndSortAllSections).toHaveBeenCalledWith(
                sort,
                order,
            );
        });
    });

    describe("[S-S-02] SectionService.getSpecificSection()", () => {
        // Given
        const sectionId = faker.number.int();

        it("[S-S-02-01] Success", async () => {
            // Given
            const section = new Section();
            const mockedFindSectionDetailById = jest
                .spyOn(sectionRepository, "findSectionDetailById")
                .mockResolvedValueOnce(section);

            // When
            const result = await sectionService.getSpecificSection(sectionId);

            // Then
            expect(result).toEqual(section);
            expect(mockedFindSectionDetailById).toHaveBeenCalledTimes(1);
            expect(mockedFindSectionDetailById).toHaveBeenCalledWith(sectionId);
        });
    });

    describe("[S-S-03] SectionService.createSection()", () => {
        // Given
        const userId = faker.number.int();
        const subject = faker.lorem.word();
        const description = faker.lorem.sentence();

        it("[S-S-03-01] Success", async () => {
            // Given
            const creator = new User();
            const mockedFindUserById = jest
                .spyOn(userRepository, "findUserById")
                .mockResolvedValueOnce(creator);

            const section = new Section();
            const mockedCreateSection = jest
                .spyOn(sectionRepository, "createSection")
                .mockResolvedValueOnce(section);

            // When
            const result = await sectionService.createSection(
                userId,
                subject,
                description,
            );

            // Then
            expect(result).toEqual(section);
            expect(mockedFindUserById).toHaveBeenCalledTimes(1);
            expect(mockedFindUserById).toHaveBeenCalledWith(userId);
            expect(mockedCreateSection).toHaveBeenCalledTimes(1);
            expect(mockedCreateSection).toHaveBeenCalledWith(
                creator,
                subject,
                description,
            );
        });
    });

    describe("[S-S-04] SectionService.updateSectionSubject()", () => {
        // Given
        const sectionId = faker.number.int();
        const subject = faker.lorem.word();

        it("[S-S-04-01] Success", async () => {
            // Given
            const section = new Section();
            const mockedFindSectionById = jest
                .spyOn(sectionRepository, "findSectionById")
                .mockResolvedValueOnce(section);

            const mockedSave = jest
                .spyOn(sectionRepository, "save")
                .mockResolvedValueOnce(section);

            // When
            const result = await sectionService.updateSectionSubject(
                sectionId,
                subject,
            );

            // Then
            expect(result).toEqual(section);
            expect(result.subject).toBe(subject);
            expect(mockedFindSectionById).toHaveBeenCalledTimes(1);
            expect(mockedFindSectionById).toHaveBeenCalledWith(sectionId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(section);
        });
    });

    describe("[S-S-05] SectionService.updateSectionDescription()", () => {
        // Given
        const sectionId = faker.number.int();
        const description = faker.lorem.sentence();

        it("[S-S-05-01] Success", async () => {
            // Given
            const section = new Section();
            const mockedFindSectionById = jest
                .spyOn(sectionRepository, "findSectionById")
                .mockResolvedValueOnce(section);

            const mockedSave = jest
                .spyOn(sectionRepository, "save")
                .mockResolvedValueOnce(section);

            // When
            const result = await sectionService.updateSectionDescription(
                sectionId,
                description,
            );

            // Then
            expect(result).toEqual(section);
            expect(result.description).toBe(description);
            expect(mockedFindSectionById).toHaveBeenCalledTimes(1);
            expect(mockedFindSectionById).toHaveBeenCalledWith(sectionId);
            expect(mockedSave).toHaveBeenCalledTimes(1);
            expect(mockedSave).toHaveBeenCalledWith(section);
        });
    });

    describe("[S-S-06] SectionService.deleteSection()", () => {
        // Given
        const sectionId = faker.number.int();

        it("[S-S-06-01] Success", async () => {
            // Given
            const mockedDeleteSection = jest
                .spyOn(sectionRepository, "deleteSection")
                .mockResolvedValueOnce();

            // When & Then
            await expect(
                sectionService.deleteSection(sectionId),
            ).resolves.toBeUndefined();

            // Additional checks
            expect(mockedDeleteSection).toHaveBeenCalledTimes(1);
            expect(mockedDeleteSection).toHaveBeenCalledWith(sectionId);
        });

        it("[S-S-06-02] Failed to delete section", async () => {
            // Given
            const mockedDeleteSection = jest
                .spyOn(sectionRepository, "deleteSection")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                sectionService.deleteSection(sectionId),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedDeleteSection).toHaveBeenCalledTimes(1);
            expect(mockedDeleteSection).toHaveBeenCalledWith(sectionId);
        });
    });

    describe("[S-S-07] SectionService.getQuestionsBySection()", () => {
        // Given
        const sectionId = faker.number.int();
        const page = faker.number.int();
        const limit = faker.number.int();
        const sort = "saved";
        const order = "ASC";
        const search = faker.lorem.word();

        it("[S-S-07-01] Success", async () => {
            // Given
            const section = new Section();
            const mockedFindSectionById = jest
                .spyOn(sectionRepository, "findSectionById")
                .mockResolvedValueOnce(section);

            const questions = [new Question(), new Question(), new Question()];
            const total = questions.length;
            const mockedFindQuestionsBySectionId = jest
                .spyOn(questionRepository, "findQuestionsBySectionId")
                .mockResolvedValueOnce([questions, total]);

            // When
            const result = await sectionService.getQuestionsBySection(
                sectionId,
                page,
                limit,
                sort,
                order,
                search,
            );

            // Then
            expect(result).toEqual([questions, total]);
            expect(mockedFindSectionById).toHaveBeenCalledTimes(1);
            expect(mockedFindSectionById).toHaveBeenCalledWith(sectionId);
            expect(mockedFindQuestionsBySectionId).toHaveBeenCalledTimes(1);
            expect(mockedFindQuestionsBySectionId).toHaveBeenCalledWith(
                sectionId,
                page,
                limit,
                sort,
                order,
                search,
            );
        });
    });
});
