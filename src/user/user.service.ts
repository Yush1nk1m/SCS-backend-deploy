import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { UserRepository } from "../repository/user.repository";
import { User } from "./user.entity";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { IsolationLevel, Transactional } from "typeorm-transactional";
import * as bcrypt from "bcrypt";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { Book } from "../book/book.entity";
import { BookRepository } from "../repository/book.repository";
import { ContributionType } from "./types/contribution.enum";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UserService {
    private logger = new Logger("UserService");

    constructor(
        private readonly userRepository: UserRepository,
        private readonly bookRepository: BookRepository,
        private readonly configService: ConfigService,
    ) {}

    // [U-01] Service logic
    async findAllUsers(): Promise<User[]> {
        return this.userRepository.findAllUsers();
    }

    // [U-02], [U-03] Service logic
    async findUser(id: number) {
        // find user from DB
        const user = await this.userRepository.findUserById(id);

        // if user does not exist, it is an error
        if (!user) {
            throw new NotFoundException(`User has not been found.`);
        }

        return user;
    }

    // [U-04] Service logic
    // DB operations need to be protected by change
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async changeUserPassword(
        id: number,
        changePasswordDto: ChangePasswordDto,
    ): Promise<void> {
        // extract passwords
        const { password, newPassword, confirmPassword } = changePasswordDto;

        // new password and confirm password need to be equal
        if (newPassword !== confirmPassword) {
            throw new BadRequestException(
                "The new password does not match the confirm password.",
            );
        }

        // find user by id and check if it exists
        const user = await this.userRepository.findUserById(id);
        if (!user) {
            throw new UnauthorizedException("User information is invalid.");
        }

        // check if the current password is correct and change the password, remove refresh token
        if (user.password && (await bcrypt.compare(password, user.password))) {
            const salt = await bcrypt.genSalt(
                parseInt(this.configService.get("SALT_LENGTH")) || 10,
            );
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await this.userRepository.updatePassword(user.id, hashedPassword);
        } else {
            throw new UnauthorizedException(
                "The current password is incorrect.",
            );
        }
    }

    // [U-05] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async changeUserNickname(userId: number, nickname: string): Promise<User> {
        // find user from DB
        const user = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        // change user's nickname and return
        user.nickname = nickname;
        return this.userRepository.save(user);
    }

    // [U-06] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async deleteUser(id: number, deleteUserDto: DeleteUserDto): Promise<void> {
        const { password, confirmMessage } = deleteUserDto;

        if (confirmMessage !== "회원 탈퇴를 희망합니다.") {
            throw new BadRequestException("Confirm message is invalid.");
        }

        const user = await this.userRepository.findUserById(id);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException("User information is invalid.");
        }

        await this.userRepository.deleteUserById(id);
    }

    // [U-07] Service logic
    async getMyBooks(
        userId: number,
        page: number = 1,
        limit: number = 10,
        sort: "createdAt" | "likeCount" = "createdAt",
        order: "ASC" | "DESC" = "DESC",
        search: string,
    ): Promise<[Book[], number]> {
        // find user from DB
        const user = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        // find books from DB
        return this.bookRepository.findBooksWithQueryByUserId(
            userId,
            page,
            limit,
            sort,
            order,
            search,
        );
    }

    // [U-07] Service logic
    async getLikedBooks(
        userId: number,
        page: number = 1,
        limit: number = 10,
        sort: "createdAt" | "likeCount" = "createdAt",
        order: "ASC" | "DESC" = "DESC",
        search: string,
    ): Promise<[Book[], number]> {
        // find user from DB
        const user = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        return this.userRepository.findBooksLikedByUser(
            userId,
            page,
            limit,
            sort,
            order,
            search,
        );
    }

    // [U-09] Service logic
    async getUserContribution(
        userId: number,
        type: ContributionType,
    ): Promise<[number, number]> {
        switch (type) {
            case ContributionType.CREATED:
                return this.userRepository.findTotalCreate(userId);
            case ContributionType.QUESTION:
                return this.userRepository.findQuestionsTotalSaved(userId);
            case ContributionType.ACTION:
                return this.userRepository.findActionsTotalLiked(userId);
            case ContributionType.BOOK:
                return this.userRepository.findBooksTotalLiked(userId);
        }
    }

    // [U-10] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async changeUserAffiliation(
        userId: number,
        affiliation: string,
    ): Promise<User> {
        // find user from DB
        const user = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        // change user's affiliation and return
        user.affiliation = affiliation;
        return this.userRepository.save(user);
    }

    // [U-11] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async changeUserPosition(userId: number, position: string): Promise<User> {
        // find user from DB
        const user = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        // change user's position and return
        user.position = position;
        return this.userRepository.save(user);
    }
}
