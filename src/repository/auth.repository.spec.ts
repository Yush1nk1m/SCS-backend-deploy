import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AuthRepository } from "./auth.repository";
import { DataSource, Repository } from "typeorm";
import { Verification } from "../auth/verification.entity";
import { InternalServerErrorException } from "@nestjs/common";

describe("AuthRepository", () => {
    let authRepository: AuthRepository;
    let dataSource: DataSource;
    let repository: Repository<Verification>;

    // define a mocked input
    const email: string = "kys010306@sogang.ac.kr";
    const verificationCode: string = "123456";
    const verified = true;
    const verification: Verification = {
        id: expect.any(Number),
        email: expect.any(String),
        verificationCode: expect.any(String),
        verified: expect.any(Boolean),
        createdAt: expect.any(Date),
    };
    const none: Verification = null;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthRepository,
                {
                    provide: DataSource,
                    useValue: {
                        createEntityManager: jest.fn().mockReturnValue({
                            save: jest.fn(),
                            update: jest.fn(),
                            findOne: jest.fn(),
                            delete: jest.fn(),
                            upsert: jest.fn(),
                        }),
                    },
                },
                {
                    provide: getRepositoryToken(Verification),
                    useClass: Repository,
                },
            ],
        }).compile();

        authRepository = module.get<AuthRepository>(AuthRepository);
        dataSource = module.get<DataSource>(DataSource);
        repository = module.get<Repository<Verification>>(
            getRepositoryToken(Verification),
        );
    });

    it("should be defined", () => {
        expect(authRepository).toBeDefined();
    });

    describe("[R-A-01] AuthRepository.createVerification()", () => {
        it("[R-A-01-01] Success", async () => {
            // mock a return value
            const mockedFunc = jest
                .spyOn(authRepository, "upsert")
                .mockResolvedValueOnce(null);

            // execute
            await expect(
                authRepository.createVerification(email, verificationCode),
            ).resolves.toBeUndefined();

            // check if the mocked function has been called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });

        it("[R-A-01-02] Exception occurred", async () => {
            // mock a return value
            const mockedFunc = jest
                .spyOn(authRepository, "upsert")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // execute
            await expect(
                authRepository.createVerification(email, verificationCode),
            ).rejects.toThrow(InternalServerErrorException);

            // check if the mocked function has been called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });
    });

    describe("[R-A-02] AuthRepository.updateVerification()", () => {
        it("[R-A-02-01] Success", async () => {
            // mock
            const mockedFunc = jest
                .spyOn(authRepository, "update")
                .mockResolvedValueOnce(null);

            // execute & expect
            await expect(
                authRepository.updateVerification(
                    email,
                    verificationCode,
                    verified,
                ),
            ).resolves.toBeUndefined();

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });

        it("[R-A-02-02] Exception occurred", async () => {
            // mock
            const mockedFunc = jest
                .spyOn(authRepository, "update")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // execute & expect
            await expect(
                authRepository.updateVerification(
                    email,
                    verificationCode,
                    verified,
                ),
            ).rejects.toThrow(InternalServerErrorException);

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });
    });

    describe("[R-A-03] AuthRepository.findVerification()", () => {
        it("[R-A-03-01] Success", async () => {
            // mock
            const mockedFunc = jest
                .spyOn(authRepository, "findOne")
                .mockResolvedValueOnce(verification);

            // execute & expect
            await expect(
                authRepository.findVerification(email, verificationCode),
            ).resolves.toEqual(verification);

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });

        it("[R-A-03-02] Not found", async () => {
            // mock
            const mockedFunc = jest
                .spyOn(authRepository, "findOne")
                .mockResolvedValueOnce(none);

            // execute & expect
            await expect(
                authRepository.findVerification(email, verificationCode),
            ).resolves.toEqual(none);

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });

        it("[R-A-03-03] Exception occurred", async () => {
            // mock
            const mockedFunc = jest
                .spyOn(authRepository, "findOne")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // execute & expect
            await expect(
                authRepository.findVerification(email, verificationCode),
            ).rejects.toThrow(InternalServerErrorException);

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });
    });

    describe("[R-A-04] AuthRepository.deleteVerification()", () => {
        it("[R-A-04-01] Success", async () => {
            // mock
            const mockedFunc = jest
                .spyOn(authRepository, "delete")
                .mockResolvedValueOnce();

            // execute & expect
            await expect(
                authRepository.deleteVerification(email),
            ).resolves.toBeUndefined();

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });

        it("[R-A-04-02] Exception occurred", async () => {
            // mock
            const mockedFunc = jest
                .spyOn(authRepository, "delete")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // execute & expect
            await expect(
                authRepository.deleteVerification(email),
            ).rejects.toThrow(InternalServerErrorException);

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });
    });
});
