import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity";
import { Question } from "../question/question.entity";

@Entity()
export class Book {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "enum",
        enum: ["public", "private"],
        default: "public",
    })
    visibility: string;

    @Column()
    @Index("IDX_BOOK_TITLE")
    title: string;

    @Column()
    description: string;

    @Column({ default: 0 })
    @Index("IDX_BOOK_LIKECOUNT")
    likeCount: number;

    @CreateDateColumn()
    @Index("IDX_BOOK_CREATEDAT")
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.books, { onDelete: "CASCADE" })
    @Index("IDX_BOOK_PUBLISHER")
    publisher: User;

    @ManyToMany(() => Question, (question) => question.books, {
        cascade: true,
        onDelete: "CASCADE",
    })
    @JoinTable({ name: "BookQuestion" })
    questions: Question[];

    @ManyToMany(() => User, (user) => user.likedBooks, {
        onDelete: "CASCADE",
    })
    @JoinTable({ name: "BookLike" })
    likedBy: User[];
}
