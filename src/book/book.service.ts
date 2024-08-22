import {
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { BookRepository } from "../repository/book.repository";
import { QuestionRepository } from "../repository/question.repository";
import { UserRepository } from "../repository/user.repository";
import { Book } from "./book.entity";
import { IsolationLevel, Transactional } from "typeorm-transactional";
import { BookVisibility } from "./types/book-visibility.type";
import { GetQuestionsQueryDto } from "../section/dto/get-questions-query.dto";
import { Question } from "../question/question.entity";

@Injectable()
export class BookService {
    private logger = new Logger("BookService");

    constructor(
        private readonly bookRepository: BookRepository,
        private readonly questionRepository: QuestionRepository,
        private readonly userRepository: UserRepository,
    ) {}

    // [B-01] Service logic
    async getBooks(
        page: number,
        limit: number,
        sort: "createdAt" | "likeCount",
        order: "ASC" | "DESC",
        search: string,
    ): Promise<[Book[], number]> {
        // find books and return
        return this.bookRepository.findBooksWithQuery(
            page,
            limit,
            sort,
            order,
            search,
        );
    }

    // [B-02] Service logic
    async getBook(bookId: number): Promise<Book> {
        // find a book from DB
        const book = await this.bookRepository.findBookById(bookId);

        // if the book does not exist, it is an error
        if (!book) {
            throw new NotFoundException(
                `Book with id ${bookId} has not been found.`,
            );
        }

        return book;
    }

    // [B-03] Service logic
    async createBook(
        userId: number,
        visibility: BookVisibility,
        title: string,
        description: string,
    ): Promise<Book> {
        // find user from DB
        const publisher = await this.userRepository.findUserById(userId);

        // if user does not exist, it is an error
        if (!publisher) {
            throw new UnauthorizedException("User does not exist.");
        }

        // create new book, save it, and return
        const book = this.bookRepository.create({
            visibility,
            title,
            description,
            publisher,
        });

        return this.bookRepository.save(book);
    }

    // [B-04] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async updateBook(
        userId: number,
        bookId: number,
        title: string,
        description: string,
    ): Promise<Book> {
        // find a book from DB
        const book = await this.bookRepository.findBookById(bookId);

        // if the book does not exist, it is an error
        if (!book) {
            throw new NotFoundException(
                `Book with id ${bookId} has not been found.`,
            );
        }

        // if the publisher of the book is not equal to the user, it is an error
        if (book.publisher.id !== userId) {
            throw new ForbiddenException("User cannot access to the book.");
        }

        // update new title, save it, and return
        book.title = title;
        book.description = description;
        return this.bookRepository.save(book);
    }

    // [B-06] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async deleteBook(userId: number, bookId: number): Promise<void> {
        // find a book from DB
        const book = await this.bookRepository.findBookAndQuestionsById(bookId);

        // if the book does not exist, it is an error
        if (!book) {
            throw new NotFoundException(
                `Book with id ${bookId} has not been found.`,
            );
        }

        // if the publisher of the book is not equal to the user, it is an error
        if (book.publisher.id !== userId) {
            throw new ForbiddenException("User cannot access to the book.");
        }

        // decrease saved count for each question and save it
        book.questions.forEach((question) => question.saved--);
        await this.bookRepository.save(book);

        // delete book from DB
        await this.bookRepository.delete({ id: bookId });
    }

    // [B-07] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async saveQuestion(
        userId: number,
        bookId: number,
        questionId: number,
    ): Promise<void> {
        // find a question from DB
        const question =
            await this.questionRepository.findQuestionById(questionId);

        // if the question does not exist, it is an error
        if (!question) {
            throw new NotFoundException(
                `Question with id ${questionId} has not been found.`,
            );
        }

        // find a book from DB
        const book = await this.bookRepository.findBookAndQuestionsById(bookId);

        // if the book does not exist, it is an error
        if (!book) {
            throw new NotFoundException(
                `Book with id ${bookId} has not been found.`,
            );
        }

        // if the publisher of the book is not equal to the user, it is an error
        if (book.publisher.id !== userId) {
            throw new ForbiddenException("User cannot access to the book.");
        }

        // if the question already exists, it is an error
        if (
            book.questions.some(
                (savedQuestion) => savedQuestion.id === question.id,
            )
        ) {
            throw new ConflictException("Question has already been saved.");
        }

        // increase saved count of the question
        question.saved++;
        // add new question to the question list and save it
        book.questions.push(question);
        await this.bookRepository.save(book);
    }

    // [B-08] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async deleteQuestion(
        userId: number,
        bookId: number,
        questionId: number,
    ): Promise<void> {
        // find a question from DB
        const question =
            await this.questionRepository.findQuestionById(questionId);

        // if the question does not exist, it is an error
        if (!question) {
            throw new NotFoundException(
                `Question with id ${questionId} has not been found.`,
            );
        }

        // find a book from DB
        const book = await this.bookRepository.findBookAndQuestionsById(bookId);

        // if the book has not been found, it is an error
        if (!book) {
            throw new NotFoundException(
                `Book with id ${bookId} has not been found.`,
            );
        }

        // if the book has not been written by user, it is an error
        if (book.publisher.id !== userId) {
            throw new ForbiddenException("User cannot access to the book");
        }

        // generate filtered questions without question with specified id
        const filteredQuestions = book.questions.filter(
            (question) => question.id !== questionId,
        );

        // if two sizes are equal, it is an error (question does not exist in the book)
        if (filteredQuestions.length === book.questions.length) {
            throw new ConflictException(
                `Question with id ${questionId} does not exist in the book`,
            );
        }

        // update related status and save
        question.saved--;
        book.questions = filteredQuestions;
        await this.questionRepository.save(question);
        await this.bookRepository.save(book);
    }

    // [B-09] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async toggleLike(
        userId: number,
        bookId: number,
    ): Promise<[number, boolean]> {
        // find user from DB
        const user =
            await this.userRepository.findUserAndLikedBooksById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        // find a book from DB
        const book = await this.bookRepository.findBookById(bookId);

        // if the book does not exist, it is an error
        if (!book) {
            throw new NotFoundException(
                `Book with id ${bookId} does not exist.`,
            );
        }

        // like status
        let liked: boolean = null;

        // if the book has already been liked
        if (user.likedBooks.some((likedBook) => likedBook.id === book.id)) {
            // liked status will be switched to false
            liked = false;
            // delete the book from the liked books list
            user.likedBooks = user.likedBooks.filter(
                (likedBook) => likedBook.id !== book.id,
            );
            // decrease book's like count
            book.likeCount--;
        }
        // if the book has not been liked
        else {
            // liked status will be switched to true
            liked = true;
            // add the book to the liked books list
            user.likedBooks.push(book);
            // increase book's like count
            book.likeCount++;
        }

        // save the change
        await this.userRepository.save(user);
        await this.bookRepository.save(book);

        // return result
        return [book.likeCount, liked];
    }

    // [B-10] Service logic
    async getLike(userId: number, bookId: number): Promise<[number, boolean]> {
        // find user from DB
        const user =
            await this.userRepository.findUserAndLikedBooksById(userId);

        // if user does not exist, it is an error
        if (!user) {
            throw new UnauthorizedException("User does not exist.");
        }

        // find a book from DB
        const book = await this.bookRepository.findBookById(bookId);

        // if the book does not exist, it is an error
        if (!book) {
            throw new NotFoundException(
                `Book with id ${bookId} has not been found.`,
            );
        }

        // if the book has already been liked
        if (user.likedBooks.some((likedBook) => likedBook.id === book.id)) {
            return [book.likeCount, true];
        }
        // if the book has not been liked
        else {
            return [book.likeCount, false];
        }
    }

    // [B-11] Service logic
    @Transactional({
        isolationLevel: IsolationLevel.REPEATABLE_READ,
    })
    async updateBookVisibility(
        userId: number,
        bookId: number,
        visibility: BookVisibility,
    ): Promise<Book> {
        // find a book from DB
        const book = await this.bookRepository.findBookById(bookId);

        // if the book does not exist, it is an error
        if (!book) {
            throw new NotFoundException(
                `Book with id ${bookId} has not been found.`,
            );
        }

        // if the book has not been written by user, it is an error
        if (book.publisher.id !== userId) {
            throw new ForbiddenException("User cannot access to the book.");
        }

        // update book's visibility and save
        book.visibility = visibility;
        return this.bookRepository.save(book);
    }

    // [B-12] Service logic
    async getQuestionsOfBook(
        bookId: number,
        query: GetQuestionsQueryDto,
    ): Promise<[Question[], number]> {
        // find a book from DB
        const book = await this.bookRepository.findBookById(bookId);

        // if the book does not exist, it is an error
        if (!book) {
            throw new NotFoundException(
                `Book with id ${bookId} has not been found.`,
            );
        }

        // find questions and return
        return this.bookRepository.findQuestionsByBookId(bookId, query);
    }
}
