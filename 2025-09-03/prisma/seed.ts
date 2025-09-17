import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const difficultyLevels = ["easy", "medium", "hard"] as const;
  const difficultyMap: Record<string, number> = {};

  for (const level of difficultyLevels) {
    const d = await prisma.difficulty.upsert({
      where: { level },
      update: {},
      create: { level },
    });
    difficultyMap[level] = d.id;
  }

  const categories = ["Science", "History", "Sports"];
  const categoryMap: Record<string, number> = {};

  for (const name of categories) {
    const c = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap[name] = c.id;
  }

  const questions: Array<{ text: string; category: string; difficulty: typeof difficultyLevels[number] }> = [
    { text: "Was ist H2O?", category: "Science", difficulty: "easy" },
    { text: "Was ist die Gravitation?", category: "Science", difficulty: "medium" },
    { text: "Wer war der erste Bundeskanzler Deutschlands?", category: "History", difficulty: "medium" },
    { text: "Wie viele Spieler sind in einem Fußballteam auf dem Feld?", category: "Sports", difficulty: "easy" },
  ];

  for (const q of questions) {
    const categoryId = categoryMap[q.category];
    const difficultyId = difficultyMap[q.difficulty];
    await prisma.question.upsert({
      where: { text_categoryId: { text: q.text, categoryId } },
      update: { difficultyId },
      create: { text: q.text, categoryId, difficultyId },
    });
  }

  const selectedCategoryName = "Science";
  await prisma.syncSelection.upsert({
    where: { id: 1 },
    update: { categoryId: categoryMap[selectedCategoryName] },
    create: { id: 1, categoryId: categoryMap[selectedCategoryName] },
  });

  console.log("Seed complete: difficulties, categories, questions, and sync selection set to:", selectedCategoryName);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
