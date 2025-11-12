import { PrismaClient } from "model";
import { faker } from "@faker-js/faker";
const prisma = new PrismaClient();

const ensurePassengers = 20000;
const ensureAirports = 100;
const ensurePlanes = 250;

while (await prisma.passenger.count() < ensurePassengers) {
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
const planes_to_create = ensurePlanes - await prisma.plane.count();
for (let i = 0; i < planes_to_create; i++) {
    await prisma.plane.create({
        data: {
            model: faker.airline.airplane().name,
            capacity: faker.number.int({ min: 10, max: 850 }),
        },
    });
}

while (await prisma.airport.count() < ensureAirports) {
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

const ensureFlights = 1000;
const existingAirports = await prisma.airport.findMany();
const existingPlanes = await prisma.plane.findMany();

if (existingAirports.length < 2) {
    console.error("Need at least 2 airports to create flights");
} else if (existingPlanes.length === 0) {
    console.error("Need at least 1 plane to create flights");
} else {
    const flights_to_create = ensureFlights - await prisma.flight.count();
    for (let i = 0; i < flights_to_create; i++) {
        let origin: typeof existingAirports[0];
        let destination: typeof existingAirports[0];
        do {
            origin = existingAirports[Math.floor(Math.random() * existingAirports.length)];
            destination = existingAirports[Math.floor(Math.random() * existingAirports.length)];
        } while (origin.id === destination.id);

        const plane = existingPlanes[Math.floor(Math.random() * existingPlanes.length)];

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
