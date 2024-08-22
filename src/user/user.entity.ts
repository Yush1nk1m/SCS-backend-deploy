import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Section } from "../section/section.entity";
import { Question } from "../question/question.entity";
import { Action } from "../action/action.entity";
import { Comment } from "../comment/comment.entity";
import { Book } from "../book/book.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    @Index("IDX_USER_ID", { unique: true })
    id: number;

    @Column({ unique: true })
    @Index("IDX_USER_EMAIL", { unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    nickname: string;

    @Column()
    affiliation: string;

    @Column()
    position: string;

    @Column({ nullable: true })
    refreshToken: string;

    @Column({
        type: "enum",
        enum: ["user", "admin"],
        default: "user",
    })
    role: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @OneToMany(() => Section, (section) => section.creator, { cascade: true })
    sections: Section[];

    @OneToMany(() => Question, (question) => question.writer, { cascade: true })
    questions: Question[];

    @OneToMany(() => Action, (action) => action.writer, { cascade: true })
    actions: Action[];

    @ManyToMany(() => Action, (action) => action.likedBy, {
        cascade: true,
        onDelete: "CASCADE",
    })
    likedActions: Action[];

    @OneToMany(() => Comment, (comment) => comment.writer, { cascade: true })
    comments: Comment[];

    @OneToMany(() => Book, (book) => book.publisher, { cascade: true })
    books: Book[];

    @ManyToMany(() => Book, (book) => book.likedBy, {
        cascade: true,
        onDelete: "CASCADE",
    })
    likedBooks: Book[];
}
