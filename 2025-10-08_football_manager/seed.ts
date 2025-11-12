import { PrismaClient } from "./prisma/client/client.ts";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function seed() {
    console.log("Seeding Football Manager database...");

    const stadiums = [
        { name: "Allianz Arena", city: "München" },
        { name: "Signal Iduna Park", city: "Dortmund" },
        { name: "Olympiastadion", city: "Berlin" },
        { name: "Volksparkstadion", city: "Hamburg" },
        { name: "Mercedes-Benz Arena", city: "Stuttgart" },
    ];

    const createdStadiums = [];
    for (const stadium of stadiums) {
        const s = await prisma.stadium.upsert({
            where: { name: stadium.name },
            update: {},
            create: stadium,
        });
        createdStadiums.push(s);
    }
    console.log(`Created ${createdStadiums.length} stadiums`);

    const teams = [
        { name: "FC Bayern München", city: "München" },
        { name: "Borussia Dortmund", city: "Dortmund" },
        { name: "RB Leipzig", city: "Leipzig" },
        { name: "Bayer Leverkusen", city: "Leverkusen" },
        { name: "Eintracht Frankfurt", city: "Frankfurt" },
        { name: "VfL Wolfsburg", city: "Wolfsburg" },
        { name: "1. FC Union Berlin", city: "Berlin" },
        { name: "SC Freiburg", city: "Freiburg" },
    ];

    const createdTeams = [];
    for (const team of teams) {
        const t = await prisma.team.upsert({
            where: { name: team.name },
            update: {},
            create: team,
        });
        createdTeams.push(t);
    }
    console.log(`Created ${createdTeams.length} teams`);

    const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
    for (const team of createdTeams) {
        const playerCount = faker.number.int({ min: 18, max: 25 });
        for (let i = 0; i < playerCount; i++) {
            await prisma.player.create({
                data: {
                    name: faker.person.fullName(),
                    position: faker.helpers.arrayElement(positions),
                    teamId: team.id,
                },
            });
        }
    }
    const totalPlayers = await prisma.player.count();
    console.log(`Created ${totalPlayers} players`);

    const matchCount = 20;
    for (let i = 0; i < matchCount; i++) {
        const homeTeam = createdTeams[Math.floor(Math.random() * createdTeams.length)];
        let awayTeam = createdTeams[Math.floor(Math.random() * createdTeams.length)];
        while (homeTeam.id === awayTeam.id) {
            awayTeam = createdTeams[Math.floor(Math.random() * createdTeams.length)];
        }

        const stadium = createdStadiums[Math.floor(Math.random() * createdStadiums.length)];

        const date = faker.date.between({ from: "2024-01-01", to: "2025-12-31" });

        const hasResult = Math.random() > 0.2;
        const homeScore = hasResult ? faker.number.int({ min: 0, max: 5 }) : null;
        const awayScore = hasResult ? faker.number.int({ min: 0, max: 5 }) : null;

        await prisma.match.create({
            data: {
                date,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                stadiumId: stadium.id,
                homeScore,
                awayScore,
            },
        });
    }
    console.log(`Created ${matchCount} matches`);

    console.log("Seeding completed!");
}

await seed()
    .catch((e) => {
        console.error("Error seeding database:", e);
        Deno.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

