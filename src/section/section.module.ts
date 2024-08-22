import { Module } from "@nestjs/common";
import { SectionController } from "./section.controller";
import { SectionService } from "./section.service";

@Module({
    imports: [],
    controllers: [SectionController],
    providers: [SectionService],
    exports: [],
})
export class SectionModule {}
