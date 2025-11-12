import { PrismaClient } from "./prisma/client/client.ts";
import { difficulties, categories, question_types } from "./prisma/seeddata.ts";
const prisma = new PrismaClient();

function decodeHtml(html: string): string {
    return html
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ");
}

async function seed() {
    console.log(`Seeding...db url: ${Deno.env.get("DATABASE_URL")}`);

    const db_types = new Set((await prisma.type.findMany()).map(t => t.type));
    for (const type of question_types) {
        if (!db_types.has(type)) {
            await prisma.type.create({ data: { type } });
        }
    }
    console.log("Types seeded");

    // Difficulty 1: einfache Liste
    const given_difficulties = new Set(difficulties);
    const db_difficulties = new Set((await prisma.difficulty.findMany()).map(d => d.level));
    console.log("DB Difficulties found: ", db_difficulties);
    console.log("Difficulties found: ", given_difficulties);
    const to_add_difficulties = [...given_difficulties].filter(d => !db_difficulties.has(d));
    console.log("Difficulties to add: ", to_add_difficulties);
    for (const level of to_add_difficulties) {
        await prisma.difficulty.create({ data: { level } });
    }
    const to_delete_difficulties = [...db_difficulties].filter(d => !given_difficulties.has(d));
    console.log("Difficulties to delete: ", to_delete_difficulties);
    for (const level of to_delete_difficulties) {
        await prisma.difficulty.deleteMany({ where: { level } });
    }

    // Difficulty 2: Liste von Objekten
    const given_categories_map = new Map<string, number>(categories.map((c: any) => [c.name, Number.parseInt(c.id)]));
    const db_categories = new Map((await prisma.category.findMany()).map(c => [c.name, c.id]));
    const given_names = new Set(given_categories_map.keys());
    const db_names = new Set(db_categories.keys());
    console.log(`Given Category names: ${given_names.size}`);
    console.log(`DB Category names: ${db_names.size}`);

    const to_add_categories = [...given_names].filter(n => !db_names.has(n));
    console.log("Categories to add: ", to_add_categories.length);
    for (const name of to_add_categories) {
        await prisma.category.upsert({
            where: { name },
            update: { opentdb_id: given_categories_map.get(name) },
            create: { name, opentdb_id: given_categories_map.get(name)! },
        });
    }
    console.log(`Upserted ${to_add_categories.length} categories.`);

    const to_delete = [...db_names].filter(n => !given_names.has(n));
    console.log(`Categories to delete: ${to_delete.length}`);
    await prisma.category.deleteMany({ where: { name: { in: Array.from(to_delete) } } });
    console.log(`Deleted ${to_delete.length} categories.`);

    const selectedCategoryName = "General Knowledge";
    const selectedCategory = await prisma.category.findUnique({
        where: { name: selectedCategoryName },
    });

    if (!selectedCategory) {
        console.log(`Category "${selectedCategoryName}" not found. Using first available category.`);
        const firstCategory = await prisma.category.findFirst();
        if (!firstCategory) {
            console.log("No categories available. Skipping question seeding.");
            return;
        }
        await seedQuestionsForCategory(firstCategory.opentdb_id, firstCategory.id);
    } else {
        await seedQuestionsForCategory(selectedCategory.opentdb_id, selectedCategory.id);
    }
}

async function seedQuestionsForCategory(opentdbCategoryId: number, categoryId: string) {
    console.log(`\nFetching questions for category ID: ${opentdbCategoryId}`);

    const dbDifficulties = await prisma.difficulty.findMany();
    const dbTypes = await prisma.type.findMany();
    const difficultyMap = new Map(dbDifficulties.map(d => [d.level, d.id]));
    const typeMap = new Map(dbTypes.map(t => [t.type, t.id]));

    const difficultiesToFetch = ['easy', 'medium', 'hard'];
    const questionCount = 10;

    for (const difficulty of difficultiesToFetch) {
        const difficultyId = difficultyMap.get(difficulty);
        if (!difficultyId) {
            console.log(`Difficulty "${difficulty}" not found in database. Skipping.`);
            continue;
        }

        for (const type of ['multiple', 'boolean']) {
            const typeId = typeMap.get(type);
            if (!typeId) {
                console.log(`Type "${type}" not found in database. Skipping.`);
                continue;
            }

            try {
                const url = `https://opentdb.com/api.php?amount=${questionCount}&category=${opentdbCategoryId}&difficulty=${difficulty}&type=${type}`;
                console.log(`Fetching from: ${url}`);
                const response = await fetch(url);
                const data = await response.json();

                if (data.response_code !== 0) {
                    console.log(`API returned error code: ${data.response_code}`);
                    continue;
                }

                for (const q of data.results || []) {
                    const questionText = decodeHtml(q.question);
                    const correctAnswerText = decodeHtml(q.correct_answer);
                    const incorrectAnswers = q.incorrect_answers.map((a: string) => decodeHtml(a));

                    const existingQuestion = await prisma.question.findFirst({
                        where: {
                            question: questionText,
                            categoryId: categoryId,
                        },
                    });

                    if (existingQuestion) {
                        console.log(`Question already exists: ${questionText.substring(0, 50)}...`);
                        continue;
                    }

                    let correctAnswer = await prisma.answer.findFirst({
                        where: { answer: correctAnswerText },
                    });
                    if (!correctAnswer) {
                        correctAnswer = await prisma.answer.create({
                            data: { answer: correctAnswerText },
                        });
                    }

                    const incorrectAnswerIds = [];
                    for (const incorrectText of incorrectAnswers) {
                        let answer = await prisma.answer.findFirst({
                            where: { answer: incorrectText },
                        });
                        if (!answer) {
                            answer = await prisma.answer.create({
                                data: { answer: incorrectText },
                            });
                        }
                        incorrectAnswerIds.push(answer.id);
                    }

                    await prisma.question.create({
                        data: {
                            question: questionText,
                            categoryId: categoryId,
                            difficultyId: difficultyId,
                            typeId: typeId,
                            correct_answer_id: correctAnswer.id,
                            incorrect_answers: {
                                connect: incorrectAnswerIds.map(id => ({ id })),
                            },
                        },
                    });
                }

                console.log(`Created questions for difficulty: ${difficulty}, type: ${type}`);
            } catch (error) {
                console.error(`Error fetching questions for ${difficulty}/${type}:`, error);
            }
        }
    }

    const totalQuestions = await prisma.question.count({
        where: { categoryId: categoryId },
    });
    console.log(`\nTotal questions in database for this category: ${totalQuestions}`);
}

await seed();
console.log("Seeding finished.");
