import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Section } from "../section/section.entity";
import { User } from "../user/user.entity";

@Injectable()
export class SectionRepository extends Repository<Section> {
    private logger = new Logger("SectionRepository");

    constructor(private readonly dataSource: DataSource) {
        super(Section, dataSource.createEntityManager());
    }

    async findSectionById(id: number): Promise<Section> {
        return this.findOne({ where: { id }, relations: ["creator"] });
    }

    async findSectionDetailById(id: number): Promise<Section> {
        return this.findOne({
            withDeleted: true,
            where: { id },
            relations: ["creator"],
        });
    }

    async findAllSections(): Promise<Section[]> {
        return this.find({
            withDeleted: true,
            relations: ["creator"],
        });
    }

    async findAndSortAllSections(
        sort: "subject" | "id" = "id",
        order: "ASC" | "DESC" = "ASC",
    ): Promise<Section[]> {
        return this.find({
            withDeleted: true,
            relations: ["creator"],
            order: {
                [sort]: order,
            },
        });
    }

    async createSection(
        creator: User,
        subject: string,
        description: string,
    ): Promise<Section> {
        const section = this.create({ subject, description, creator });
        await this.save(section);

        return section;
    }

    async findAndUpdateSectionSubject(
        id: number,
        subject: string,
    ): Promise<Section> {
        const section = await this.findSectionById(id);
        if (!section) {
            throw new NotFoundException(`Section ${id} not found.`);
        }

        section.subject = subject;
        await this.save(section);

        return section;
    }

    async findAndUpdateSectionDescription(
        id: number,
        description: string,
    ): Promise<Section> {
        const section = await this.findSectionById(id);
        if (!section) {
            throw new NotFoundException(`Section ${id} not found.`);
        }

        section.description = description;
        await this.save(section);

        return section;
    }

    async deleteSection(id: number): Promise<void> {
        await this.delete({ id });
    }
}
