import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity";
import { Question } from "../question/question.entity";
import { Comment } from "../comment/comment.entity";

@Entity()
@Index(["question", "updatedAt"])
@Index(["question", "likeCount"])
export class Action {
    @PrimaryGeneratedColumn()
    @Index("IDX_ACTION_ID")
    id: number;

    @Column()
    @Index("IDX_ACTION_TITLE")
    title: string;

    @Column("text")
    content: string;

    @Column("text")
    rawContent: string;

    @Column("simple-array", { nullable: true })
    imageUrls: string[];

    @Column({ default: 0 })
    likeCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.actions, { onDelete: "CASCADE" })
    writer: User;

    @ManyToOne(() => Question, (question) => question.actions, {
        onDelete: "CASCADE",
    })
    @Index("IDX_ACTION_QUESTION")
    question: Question;

    @ManyToMany(() => User, (user) => user.likedActions, {
        onDelete: "CASCADE",
    })
    @JoinTable({ name: "ActionLike" })
    likedBy: User[];

    @OneToMany(() => Comment, (comment) => comment.action, { cascade: true })
    comments: Comment[];
}
