import { ensurePassengers } from "./repository/passengers.ts";
import { ensurePlanes } from "./repository/plane.ts";
import { ensureAirports } from "./repository/airport.ts";
import { ensureFlights } from "./repository/flight.ts";
import { prisma } from "./repository/db.ts";

const ensurePassengersCount = 20000;
const ensureAirportsCount = 100;
const ensurePlanesCount = 250;
const ensureFlightsCount = 1000;

await ensurePassengers(ensurePassengersCount);
console.log(`Ensured ${ensurePassengersCount} passengers`);

await ensurePlanes(ensurePlanesCount);
console.log(`Ensured ${ensurePlanesCount} planes`);

await ensureAirports(ensureAirportsCount);
console.log(`Ensured ${ensureAirportsCount} airports`);

await ensureFlights(ensureFlightsCount);
console.log(`Ensured ${ensureFlightsCount} flights`);

await prisma.$disconnect();
console.log("Seeding completed!");
