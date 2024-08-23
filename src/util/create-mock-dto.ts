import { faker } from "@faker-js/faker";

export function createMockDto<T>(dto: new () => T): T {
    const instance = new dto();

    Object.keys(instance).forEach((key) => {
        const value = instance[key];
        switch (typeof value) {
            case "string":
                instance[key] = faker.lorem.word();
                break;
            case "number":
                instance[key] = faker.number.int();
                break;
            case "boolean":
                instance[key] = faker.datatype.boolean();
                break;

            // Add case if it is needed
        }
    });

    return instance;
}
