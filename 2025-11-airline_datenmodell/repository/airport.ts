import { prisma } from "./db.ts";
import { faker } from "@faker-js/faker";

export async function ensureAirports(count: number) {
    while (await prisma.airport.count() < count) {
        try {
            const fake_airport = faker.airline.airport();
            await prisma.airport.create({
                data: {
                    name: fake_airport.name,
                    iataCode: fake_airport.iataCode,
                    city: faker.location.city(),
                },
            });
        } catch (e) {
            console.error(`Error creating airport`, (e as Error).message);
        }
    }
}

export async function getAllAirports() {
    return await prisma.airport.findMany();
}

export async function getRandomAirport() {
    const airports = await getAllAirports();
    if (airports.length === 0) {
        throw new Error("No airports available");
    }
    return airports[Math.floor(Math.random() * airports.length)];
}

export async function getRandomAirports(count: number) {
    const airports = await getAllAirports();
    if (airports.length < count) {
        throw new Error(`Not enough airports available. Need ${count}, have ${airports.length}`);
    }
    const shuffled = [...airports].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

export async function getAirportById(id: string) {
    return await prisma.airport.findUnique({
        where: { id },
    });
}

export async function getAirportByIataCode(iataCode: string) {
    return await prisma.airport.findUnique({
        where: { iataCode },
    });
}

