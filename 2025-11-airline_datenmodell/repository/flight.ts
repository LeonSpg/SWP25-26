import { prisma } from "./db.ts";
import { faker } from "@faker-js/faker";
import { getAllAirports, getRandomAirport } from "./airport.ts";
import { getAllPlanes, getRandomPlane } from "./plane.ts";

export async function ensureFlights(count: number) {
    const existingAirports = await getAllAirports();
    const existingPlanes = await getAllPlanes();

    if (existingAirports.length < 2) {
        throw new Error("Need at least 2 airports to create flights");
    }
    if (existingPlanes.length === 0) {
        throw new Error("Need at least 1 plane to create flights");
    }

    const flights_to_create = count - await prisma.flight.count();
    for (let i = 0; i < flights_to_create; i++) {
        let origin = await getRandomAirport();
        let destination = await getRandomAirport();
        while (origin.id === destination.id) {
            destination = await getRandomAirport();
        }

        const plane = await getRandomPlane();

        const departureTime = faker.date.future();
        const flightDuration = faker.number.int({ min: 1, max: 12 });
        const arrivalTime = new Date(departureTime.getTime() + flightDuration * 60 * 60 * 1000);

        const airlineCode = faker.airline.airline().iataCode || "XX";
        const flightNumber = `${airlineCode}${faker.number.int({ min: 100, max: 9999 })}`;

        await prisma.flight.create({
            data: {
                flightNumber,
                departureTime,
                arrivalTime,
                originId: origin.id,
                destinationId: destination.id,
                planeId: plane.id,
            },
        });
    }
    console.log(`Created ${flights_to_create} flights`);
}

export async function getAllFlights() {
    return await prisma.flight.findMany({
        include: {
            origin: true,
            destination: true,
            plane: true,
            passengers: true,
        },
    });
}

export async function getFlightById(id: string) {
    return await prisma.flight.findUnique({
        where: { id },
        include: {
            origin: true,
            destination: true,
            plane: true,
            passengers: true,
        },
    });
}

export async function getFlightsByOrigin(originId: string) {
    return await prisma.flight.findMany({
        where: { originId },
        include: {
            origin: true,
            destination: true,
            plane: true,
            passengers: true,
        },
    });
}

export async function getFlightsByDestination(destinationId: string) {
    return await prisma.flight.findMany({
        where: { destinationId },
        include: {
            origin: true,
            destination: true,
            plane: true,
            passengers: true,
        },
    });
}

export async function addPassengerToFlight(flightId: string, passengerId: string) {
    return await prisma.flight.update({
        where: { id: flightId },
        data: {
            passengers: {
                connect: { id: passengerId },
            },
        },
    });
}

