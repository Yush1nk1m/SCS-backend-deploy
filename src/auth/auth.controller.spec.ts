import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { EmailDto } from "./dto/email.dto";
import { ResponseDto } from "src/common/dto/response.dto";
import { HttpStatus, InternalServerErrorException } from "@nestjs/common";
import { VerificationDto } from "./dto/verification.dto";
import { User } from "../user/user.entity";
import { SignupDto } from "./dto/signup.dto";

describe("AuthController", () => {
    let authController: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        sendVerificationMail: jest.fn(),
                        verifySignupCode: jest.fn(),
                        signup: jest.fn(),
                    },
                },
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    it("should be defined", () => {
        expect(authController).toBeDefined();
        expect(authService).toBeDefined();
    });

    describe("[C-A-01] AuthController.sendVerificationMail()", () => {
        // define a mocked input
        const emailDto: EmailDto = {
            email: "kys010306@sogang.ac.kr",
        };

        it("[C-A-01-01] Success", async () => {
            // mock a service method
            const mockedFunc = jest
                .spyOn(authService, "sendVerificationMail")
                .mockResolvedValue();

            // define an expected result
            const expectedResult: ResponseDto<null> = {
                statusCode: HttpStatus.CREATED,
                message: "A verification mail has been sent.",
            };

            await expect(
                authController.sendVerificationMail(emailDto),
            ).resolves.toEqual(expectedResult);

            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });

        it("[C-A-01-02] Exception occurred", async () => {
            // mock a service method
            const mockedFunc = jest
                .spyOn(authService, "sendVerificationMail")
                .mockRejectedValue(new InternalServerErrorException());

            await expect(
                authController.sendVerificationMail(emailDto),
            ).rejects.toThrow(InternalServerErrorException);

            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });
    });

    describe("[C-A-02] AuthController.verifySignupCode()", () => {
        // define a mocked input
        const verificationDto: VerificationDto = {
            email: "kys010306@sogang.ac.kr",
            verificationCode: "123456",
        };

        it("[C-A-02-01] Success", async () => {
            // mock a service method
            const mockedFunc = jest
                .spyOn(authService, "verifySignupCode")
                .mockResolvedValueOnce(true);

            // define an expected result
            const expectedResult: ResponseDto<null> = {
                statusCode: HttpStatus.OK,
                message: "Verified.",
            };

            // execute
            await expect(
                authController.verifySignupCode(verificationDto),
            ).resolves.toEqual(expectedResult);

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });

        it("[C-A-02-02] Not verified", async () => {
            // mock a service method
            const mockedFunc = jest
                .spyOn(authService, "verifySignupCode")
                .mockResolvedValueOnce(false);

            // define an expected result
            const expectedResult: ResponseDto<null> = {
                statusCode: HttpStatus.UNAUTHORIZED,
                message: "Not verified.",
            };

            // execute
            await expect(
                authController.verifySignupCode(verificationDto),
            ).resolves.toEqual(expectedResult);

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });

        it("[C-A-02-03] Exception occurred", async () => {
            // mock a service method
            const mockedFunc = jest
                .spyOn(authService, "verifySignupCode")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // execute
            await expect(
                authController.verifySignupCode(verificationDto),
            ).rejects.toThrow(InternalServerErrorException);

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });
    });

    describe("[C-A-03] AuthController.signup()", () => {
        // mock input, output
        const signupDto: SignupDto = {
            email: "kys010306@sogang.ac.kr",
            password: "password",
            nickname: "유신",
            affiliation: "서강대학교",
            position: "백엔드",
            verificationCode: "123456",
        };

        const user: User = {
            id: 1,
            email: "kys010306@sogang.ac.kr",
            password: null,
            nickname: "유신",
            affiliation: "서강대학교",
            position: "백엔드",
            createdAt: expect.any(Date),
        };

        it("[C-A-03-01] Success", async () => {
            // mock a service method and expected result
            const mockedFunc = jest
                .spyOn(authService, "signup")
                .mockResolvedValueOnce(user);
            const expectedResult: ResponseDto<User> = {
                statusCode: HttpStatus.CREATED,
                message: "A new user has been signed up.",
                data: user,
            };

            // execute
            await expect(authController.signup(signupDto)).resolves.toEqual(
                expectedResult,
            );

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });

        it("[C-A-03-02] Exception occurred", async () => {
            // mock a service method and expected result
            const mockedFunc = jest
                .spyOn(authService, "signup")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // execute
            await expect(authController.signup(signupDto)).rejects.toThrow(
                InternalServerErrorException,
            );

            // check called
            expect(mockedFunc).toHaveBeenCalledTimes(1);
        });
    });
});
