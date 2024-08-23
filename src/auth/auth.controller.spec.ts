import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { EmailDto } from "./dto/email.dto";
import { InternalServerErrorException } from "@nestjs/common";
import { VerificationDto } from "./dto/verification.dto";
import { User } from "../user/user.entity";
import { SignupDto } from "./dto/signup.dto";
import { BaseResponseDto } from "../common/dto/base-response.dto";
import { UserDto } from "../user/dto/user.dto";
import { plainToClass } from "class-transformer";
import { UserResponseDto } from "../user/dto/response.dto";
import { LoginDto } from "./dto/login.dto";
import { faker } from "@faker-js/faker";
import { Tokens } from "./types/tokens.type";
import { TokensResponseDto } from "./dto/response.dto";
import { createMockDto } from "../util/create-mock-dto";

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
                        login: jest.fn(),
                        refreshJwtTokens: jest.fn(),
                        logout: jest.fn(),
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
        // Given
        const emailDto = createMockDto(EmailDto);

        it("[C-A-01-01] Success", async () => {
            // Given
            const { email } = emailDto;

            const mockedServiceSendVerificationMail = jest
                .spyOn(authService, "sendVerificationMail")
                .mockResolvedValue();

            const expectedResponseDto: BaseResponseDto = {
                message: "A verification mail has been sent.",
            };

            // When
            const result = await authController.sendVerificationMail(emailDto);

            // Then
            expect(result).toEqual(expectedResponseDto);
            expect(mockedServiceSendVerificationMail).toHaveBeenCalledTimes(1);
            expect(mockedServiceSendVerificationMail).toHaveBeenCalledWith(
                email,
            );
        });

        it("[C-A-01-02] Exception occurred", async () => {
            // Given
            const { email } = emailDto;

            const mockedServiceSendVerificationMail = jest
                .spyOn(authService, "sendVerificationMail")
                .mockRejectedValue(new InternalServerErrorException());

            // When & Then
            await expect(
                authController.sendVerificationMail(emailDto),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedServiceSendVerificationMail).toHaveBeenCalledTimes(1);
            expect(mockedServiceSendVerificationMail).toHaveBeenCalledWith(
                email,
            );
        });
    });

    describe("[C-A-02] AuthController.verifySignupCode()", () => {
        // Given
        const verificationDto = createMockDto(VerificationDto);

        it("[C-A-02-01] Success", async () => {
            // Given
            const { email, verificationCode } = verificationDto;

            const mockedServiceVerifySignupCode = jest
                .spyOn(authService, "verifySignupCode")
                .mockResolvedValueOnce();

            const expectedResponseDto: BaseResponseDto = {
                message: "Verified.",
            };

            // When
            const result =
                await authController.verifySignupCode(verificationDto);

            // Then
            expect(result).toEqual(expectedResponseDto);
            expect(mockedServiceVerifySignupCode).toHaveBeenCalledTimes(1);
            expect(mockedServiceVerifySignupCode).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
        });

        it("[C-A-02-02] Exception occurred", async () => {
            // Given
            const { email, verificationCode } = verificationDto;

            const mockedServiceVerifySignupCode = jest
                .spyOn(authService, "verifySignupCode")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                authController.verifySignupCode(verificationDto),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedServiceVerifySignupCode).toHaveBeenCalledTimes(1);
            expect(mockedServiceVerifySignupCode).toHaveBeenCalledWith(
                email,
                verificationCode,
            );
        });
    });

    describe("[C-A-03] AuthController.signup()", () => {
        // Given
        const signupDto = createMockDto(SignupDto);
        const user = createMockDto(User);
        const userDto: UserDto = plainToClass(UserDto, user, {
            excludeExtraneousValues: true,
        });

        it("[C-A-03-01] Success", async () => {
            // Given
            const {
                email,
                password,
                nickname,
                affiliation,
                position,
                verificationCode,
            } = signupDto;

            const mockedServiceSignup = jest
                .spyOn(authService, "signup")
                .mockResolvedValueOnce(user);

            const expectedResponseDto: UserResponseDto = {
                message: "A new user has been signed up.",
                user: userDto,
            };

            // When
            const result = await authController.signup(signupDto);

            // Then
            expect(result).toEqual(expectedResponseDto);
            expect(mockedServiceSignup).toHaveBeenCalledTimes(1);
            expect(mockedServiceSignup).toHaveBeenCalledWith(
                email,
                password,
                nickname,
                affiliation,
                position,
                verificationCode,
            );
        });

        it("[C-A-03-02] Exception occurred", async () => {
            // Given
            const {
                email,
                password,
                nickname,
                affiliation,
                position,
                verificationCode,
            } = signupDto;

            const mockedServiceSignup = jest
                .spyOn(authService, "signup")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(authController.signup(signupDto)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedServiceSignup).toHaveBeenCalledTimes(1);
            expect(mockedServiceSignup).toHaveBeenCalledWith(
                email,
                password,
                nickname,
                affiliation,
                position,
                verificationCode,
            );
        });
    });

    describe("[C-A-04] AuthController.login()", () => {
        // Given
        const loginDto = createMockDto(LoginDto);
        const tokens: Tokens = {
            accessToken: faker.string.nanoid(),
            refreshToken: faker.string.nanoid(),
        };

        it("[C-A-04-01] Success", async () => {
            // Given
            const { email, password } = loginDto;

            const mockedServiceLogin = jest
                .spyOn(authService, "login")
                .mockResolvedValueOnce(tokens);

            const mockedResponseDto: TokensResponseDto = {
                message: "You have been logged in.",
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            };

            // When
            const result = await authController.login(loginDto);

            // Then
            expect(result).toEqual(mockedResponseDto);
            expect(mockedServiceLogin).toHaveBeenCalledTimes(1);
            expect(mockedServiceLogin).toHaveBeenCalledWith(email, password);
        });

        it("[C-A-04-02] Exception occurred", async () => {
            // Given
            const { email, password } = loginDto;

            const mockedServiceLogin = jest
                .spyOn(authService, "login")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(authController.login(loginDto)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Additional checks
            expect(mockedServiceLogin).toHaveBeenCalledTimes(1);
            expect(mockedServiceLogin).toHaveBeenCalledWith(email, password);
        });
    });

    describe("[C-A-05] AuthController.refresh()", () => {
        // Given
        const userId = faker.number.int();
        const refreshToken = faker.string.nanoid();
        const tokens: Tokens = {
            accessToken: faker.string.nanoid(),
            refreshToken: faker.string.nanoid(),
        };

        it("[C-A-05-01] Success", async () => {
            // Given
            const mockedServiceRefreshJwtTokens = jest
                .spyOn(authService, "refreshJwtTokens")
                .mockResolvedValueOnce(tokens);

            const mockedResponseDto: TokensResponseDto = {
                message: "JWT tokens have been refreshed.",
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            };

            // When
            const result = await authController.refresh(userId, refreshToken);

            // Then
            expect(result).toEqual(mockedResponseDto);
            expect(mockedServiceRefreshJwtTokens).toHaveBeenCalledTimes(1);
            expect(mockedServiceRefreshJwtTokens).toHaveBeenCalledWith(
                userId,
                refreshToken,
            );
        });

        it("[C-A-05-02] Exception occurred", async () => {
            // Given
            const mockedServiceRefreshJwtTokens = jest
                .spyOn(authService, "refreshJwtTokens")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(
                authController.refresh(userId, refreshToken),
            ).rejects.toThrow(InternalServerErrorException);

            // Additional checks
            expect(mockedServiceRefreshJwtTokens).toHaveBeenCalledTimes(1);
            expect(mockedServiceRefreshJwtTokens).toHaveBeenCalledWith(
                userId,
                refreshToken,
            );
        });
    });

    describe("[C-A-06] AuthController.logout()", () => {
        // Given
        const userId = faker.number.int();

        it("[C-A-06-01] Success", async () => {
            // Given
            const mockedServiceLogout = jest
                .spyOn(authService, "logout")
                .mockResolvedValueOnce();

            const mockedResponseDto: BaseResponseDto = {
                message: "You have been logged out.",
            };

            // When
            const result = await authController.logout(userId);

            // Then
            expect(result).toEqual(mockedResponseDto);
            expect(mockedServiceLogout).toHaveBeenCalledTimes(1);
            expect(mockedServiceLogout).toHaveBeenCalledWith(userId);
        });

        it("[C-A-06-02] Exception occurred", async () => {
            // Given
            const mockedServiceLogout = jest
                .spyOn(authService, "logout")
                .mockRejectedValueOnce(new InternalServerErrorException());

            // When & Then
            await expect(authController.logout(userId)).rejects.toThrow(
                InternalServerErrorException,
            );

            // Then
            expect(mockedServiceLogout).toHaveBeenCalledTimes(1);
            expect(mockedServiceLogout).toHaveBeenCalledWith(userId);
        });
    });
});
