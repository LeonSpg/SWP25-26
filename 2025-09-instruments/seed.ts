import { PrismaClient } from "./prisma/client/client.ts";

const prisma = new PrismaClient();

async function seed() {
    console.log("Seeding Instruments/Directions/Artist database...");

    const directions = [
        { name: "Classical" },
        { name: "Jazz" },
        { name: "Rock" },
        { name: "Pop" },
        { name: "Electronic" },
        { name: "Folk" },
    ];

    const createdDirections = [];
    for (const direction of directions) {
        const d = await prisma.direction.upsert({
            where: { name: direction.name },
            update: {},
            create: direction,
        });
        createdDirections.push(d);
    }
    console.log(`Created ${createdDirections.length} directions`);

    const instruments = [
        { name: "Piano", direction: "Classical" },
        { name: "Violin", direction: "Classical" },
        { name: "Cello", direction: "Classical" },
        { name: "Trumpet", direction: "Jazz" },
        { name: "Saxophone", direction: "Jazz" },
        { name: "Double Bass", direction: "Jazz" },
        { name: "Electric Guitar", direction: "Rock" },
        { name: "Drums", direction: "Rock" },
        { name: "Bass Guitar", direction: "Rock" },
        { name: "Synthesizer", direction: "Electronic" },
        { name: "Acoustic Guitar", direction: "Folk" },
        { name: "Harmonica", direction: "Folk" },
    ];

    const createdInstruments: Array<{ id: string; name: string }> = [];
    for (const instrument of instruments) {
        const direction = createdDirections.find(d => d.name === instrument.direction);
        if (direction) {
            const i = await prisma.instrument.upsert({
                where: { name: instrument.name },
                update: {},
                create: {
                    name: instrument.name,
                    directionId: direction.id,
                },
            });
            createdInstruments.push(i);
        }
    }
    console.log(`Created ${createdInstruments.length} instruments`);

    const artists = [
        { name: "Ludwig van Beethoven", instruments: ["Piano", "Violin"] },
        { name: "Miles Davis", instruments: ["Trumpet"] },
        { name: "Jimi Hendrix", instruments: ["Electric Guitar"] },
        { name: "Yo-Yo Ma", instruments: ["Cello"] },
        { name: "John Coltrane", instruments: ["Saxophone"] },
        { name: "Bob Dylan", instruments: ["Acoustic Guitar", "Harmonica"] },
        { name: "Kraftwerk", instruments: ["Synthesizer"] },
        { name: "The Beatles", instruments: ["Electric Guitar", "Drums", "Bass Guitar"] },
    ];

    for (const artist of artists) {
        const instrumentIds = artist.instruments
            .map(instName => createdInstruments.find(i => i.name === instName)?.id)
            .filter((id): id is string => id !== undefined);

        if (instrumentIds.length > 0) {
            await prisma.artist.upsert({
                where: { name: artist.name },
                update: {
                    instruments: {
                        set: instrumentIds.map(id => ({ id })),
                    },
                },
                create: {
                    name: artist.name,
                    instruments: {
                        connect: instrumentIds.map(id => ({ id })),
                    },
                },
            });
        }
    }
    const totalArtists = await prisma.artist.count();
    console.log(`Created ${totalArtists} artists`);

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

