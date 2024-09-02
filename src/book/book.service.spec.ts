import { Test, TestingModule } from "@nestjs/testing";
import { BookService } from "./book.service";

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

describe("BookService", () => {
    let service: BookService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [BookService],
        }).compile();

        service = module.get<BookService>(BookService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
