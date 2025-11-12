import { prisma } from "./db.ts";
import { faker } from "@faker-js/faker";

export async function ensurePassengers(count: number) {
    while (await prisma.passenger.count() < count) {
        try {
            await prisma.passenger.create({
                data: {
                    firstName: faker.person.firstName(),
                    lastName: faker.person.lastName(),
                    email: faker.internet.email(),
                },
            });
        } catch (e) {
            console.error(`Error creating passenger`, (e as Error).message);
        }
    }
}

export async function getAllPassengers() {
    return await prisma.passenger.findMany();
}

export async function getPassengerById(id: string) {
    return await prisma.passenger.findUnique({
        where: { id },
    });
}

