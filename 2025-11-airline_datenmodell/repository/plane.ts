import { prisma } from "./db.ts";
import { faker } from "@faker-js/faker";

export async function ensurePlanes(count: number) {
    const planes_to_create = count - await prisma.plane.count();
    for (let i = 0; i < planes_to_create; i++) {
        await prisma.plane.create({
            data: {
                model: faker.airline.airplane().name,
                capacity: faker.number.int({ min: 10, max: 850 }),
            },
        });
    }
}

export async function getAllPlanes() {
    return await prisma.plane.findMany();
}

export async function getRandomPlane() {
    const planes = await getAllPlanes();
    if (planes.length === 0) {
        throw new Error("No planes available");
    }
    return planes[Math.floor(Math.random() * planes.length)];
}

export async function getPlaneById(id: string) {
    return await prisma.plane.findUnique({
        where: { id },
    });
}

