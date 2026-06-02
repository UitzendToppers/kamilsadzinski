import assert from "node:assert";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = await prisma.user.count();
const courses = await prisma.course.count();
assert.ok(users >= 1, "Brak administratora.");
assert.ok(courses >= 3, "Brak kursów.");

await prisma.$disconnect();
console.log("Test bazy zakończony poprawnie.");
