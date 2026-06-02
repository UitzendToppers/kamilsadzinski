import "dotenv/config";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import fs from "node:fs";

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT || 4000);
const secret = process.env.JWT_SECRET || "lokalny-sekret-do-zmiany";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "..", "dist");
const uploadPath = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadPath, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadPath),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype));
  },
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  topic: z.string().min(2),
  message: z.string().min(10)
});
const bookingSchema = z.object({
  courseId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  startsAt: z.string().datetime(),
  note: z.string().optional().nullable()
});
const courseSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  badge: z.string().optional().nullable(),
  summary: z.string().min(2),
  description: z.string().min(2),
  priceCents: z.coerce.number().int().nonnegative(),
  duration: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  published: z.boolean().optional()
});

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, secret, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.headers.authorization?.replace("Bearer ", "");
  const token = header || req.cookies.token;
  if (!token) return res.status(401).json({ error: "Brak dostępu." });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: "Sesja wygasła." });
  }
}

function admin(req, res, next) {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "Brak uprawnień." });
  next();
}

async function stripeClient() {
  const row = await prisma.setting.findUnique({ where: { key: "stripe_secret_key" } });
  if (!row?.value) return null;
  return new Stripe(row.value);
}

app.get("/api/health", (_req, res) => res.json({ status: "działa" }));

app.post("/api/track", async (req, res) => {
  const data = z.object({ path: z.string().max(300), referrer: z.string().optional().nullable() }).parse(req.body);
  await prisma.pageView.create({
    data: {
      path: data.path,
      referrer: data.referrer || null,
      userAgent: req.headers["user-agent"] || null,
      ip: req.ip
    }
  });
  res.status(201).json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    return res.status(401).json({ error: "Nieprawidłowe dane logowania." });
  }
  const token = sign(user);
  res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 7 * 86400000 });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

app.get("/api/site", async (_req, res) => {
  const [sections, courses] = await Promise.all([
    prisma.siteSection.findMany(),
    prisma.course.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, include: { lessons: { orderBy: { sortOrder: "asc" } } } })
  ]);
  res.json({ sections, courses });
});

app.get("/api/pages", async (_req, res) => {
  const pages = await prisma.siteSection.findMany({ where: { key: { startsWith: "page:" } }, orderBy: { title: "asc" } });
  res.json(pages);
});

app.get("/api/courses", async (_req, res) => {
  const courses = await prisma.course.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, include: { lessons: true } });
  res.json(courses);
});

app.get("/api/courses/:slug", async (req, res) => {
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug }, include: { lessons: { orderBy: { sortOrder: "asc" } } } });
  if (!course) return res.status(404).json({ error: "Nie znaleziono kursu." });
  res.json(course);
});

app.post("/api/contact", async (req, res) => {
  const data = contactSchema.parse(req.body);
  const submission = await prisma.contactSubmission.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      topic: data.topic,
      message: data.message
    }
  });
  res.status(201).json({ id: submission.id, message: "Dziękuję. Wiadomość została wysłana." });
});

app.get("/api/availability", async (_req, res) => {
  const now = new Date();
  const horizon = new Date(now.getTime() + 21 * 86400000);
  const [blocked, bookings] = await Promise.all([
    prisma.availabilityBlock.findMany({ where: { startsAt: { gte: now, lte: horizon } }, orderBy: { startsAt: "asc" } }),
    prisma.booking.findMany({ where: { startsAt: { gte: now, lte: horizon }, status: { not: "CANCELED" } }, orderBy: { startsAt: "asc" } })
  ]);
  const busy = [...blocked, ...bookings].map((item) => ({ startsAt: item.startsAt, endsAt: item.endsAt }));
  const slots = [];
  for (let day = 1; day <= 21; day += 1) {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day);
    if ([0, 6].includes(base.getDay())) continue;
    for (const hour of [9, 11, 13, 15, 17]) {
      const startsAt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour);
      const endsAt = new Date(startsAt.getTime() + 60 * 60000);
      const isBusy = busy.some((item) => new Date(item.startsAt) < endsAt && new Date(item.endsAt) > startsAt);
      if (!isBusy) slots.push({ startsAt, endsAt });
    }
  }
  res.json({ slots, busy });
});

app.post("/api/bookings", async (req, res) => {
  const data = bookingSchema.parse(req.body);
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(startsAt.getTime() + 60 * 60000);
  const conflict = await prisma.booking.findFirst({
    where: { status: { not: "CANCELED" }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }
  });
  const block = await prisma.availabilityBlock.findFirst({ where: { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } });
  if (conflict || block) return res.status(409).json({ error: "Ten termin jest już zajęty." });
  const booking = await prisma.booking.create({
    data: { courseId: data.courseId, name: data.name, email: data.email, phone: data.phone || null, startsAt, endsAt, note: data.note || null }
  });
  res.status(201).json({ booking, message: "Termin został zarezerwowany. Możesz przejść do płatności." });
});

app.post("/api/orders", async (req, res) => {
  const schema = z.object({ courseId: z.string(), email: z.string().email(), name: z.string().min(2), bookingId: z.string().optional().nullable() });
  const data = schema.parse(req.body);
  const course = await prisma.course.findUnique({ where: { id: data.courseId } });
  if (!course) return res.status(404).json({ error: "Nie znaleziono kursu." });
  const number = `KS-${Date.now()}`;
  const order = await prisma.order.create({
    data: {
      number,
      bookingId: data.bookingId || null,
      email: data.email,
      name: data.name,
      totalCents: course.priceCents,
      items: { create: { courseId: course.id, title: course.title, priceCents: course.priceCents } },
      payments: { create: { amountCents: course.priceCents, status: "PENDING" } }
    },
    include: { items: true }
  });
  const stripe = await stripeClient();
  if (!stripe) return res.json({ order, payment: null, message: "Płatności Stripe nie są jeszcze skonfigurowane." });
  const intent = await stripe.paymentIntents.create({
    amount: order.totalCents,
    currency: "pln",
    receipt_email: order.email,
    metadata: { orderId: order.id },
    automatic_payment_methods: { enabled: true }
  });
  await prisma.order.update({ where: { id: order.id }, data: { stripeIntentId: intent.id } });
  res.json({ order, payment: { clientSecret: intent.client_secret } });
});

app.post("/api/stripe/webhook", async (req, res) => {
  const webhookSecret = await prisma.setting.findUnique({ where: { key: "stripe_webhook_secret" } });
  const stripe = await stripeClient();
  if (!stripe || !webhookSecret?.value) return res.status(400).send("Stripe nie jest skonfigurowany.");
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], webhookSecret.value);
  } catch {
    return res.status(400).send("Nieprawidłowy podpis.");
  }
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const order = await prisma.order.update({
      where: { id: intent.metadata.orderId },
      data: { status: "PAID", payments: { updateMany: { where: {}, data: { status: "SUCCEEDED", providerId: intent.id } } } },
      include: { items: true }
    });
    let user = await prisma.user.findUnique({ where: { email: order.email } });
    if (!user) {
      user = await prisma.user.create({ data: { email: order.email, name: order.name, passwordHash: await bcrypt.hash(crypto.randomUUID(), 12) } });
    }
    for (const item of order.items) {
      await prisma.purchase.upsert({ where: { userId_courseId: { userId: user.id, courseId: item.courseId } }, update: {}, create: { userId: user.id, courseId: item.courseId } });
    }
  }
  res.json({ received: true });
});

app.get("/api/admin/dashboard", auth, admin, async (_req, res) => {
  const lastHour = new Date(Date.now() - 60 * 60000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [users, orders, courses, payments, submissions, bookings, liveViews, todayViews] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.course.count(),
    prisma.payment.findMany(),
    prisma.contactSubmission.count(),
    prisma.booking.count(),
    prisma.pageView.count({ where: { createdAt: { gte: lastHour } } }),
    prisma.pageView.count({ where: { createdAt: { gte: today } } })
  ]);
  const recentOrders = await prisma.order.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { items: true } });
  res.json({
    users,
    orders,
    courses,
    submissions,
    bookings,
    liveViews,
    todayViews,
    conversionRate: todayViews ? Math.round((orders / todayViews) * 1000) / 10 : 0,
    revenueCents: payments.filter((p) => p.status === "SUCCEEDED").reduce((sum, p) => sum + p.amountCents, 0),
    recentOrders
  });
});

app.get("/api/admin/courses", auth, admin, async (_req, res) => {
  res.json(await prisma.course.findMany({ orderBy: { sortOrder: "asc" }, include: { lessons: { orderBy: { sortOrder: "asc" } } } }));
});

app.post("/api/admin/courses", auth, admin, async (req, res) => {
  const data = courseSchema.parse(req.body);
  res.status(201).json(await prisma.course.create({ data }));
});

app.put("/api/admin/courses/:id", auth, admin, async (req, res) => {
  const data = courseSchema.partial().parse(req.body);
  res.json(await prisma.course.update({ where: { id: req.params.id }, data }));
});

app.delete("/api/admin/courses/:id", auth, admin, async (req, res) => {
  await prisma.course.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.post("/api/admin/courses/reorder", auth, admin, async (req, res) => {
  const schema = z.object({ ids: z.array(z.string()) });
  const { ids } = schema.parse(req.body);
  await prisma.$transaction(ids.map((id, index) => prisma.course.update({ where: { id }, data: { sortOrder: index + 1 } })));
  res.json({ ok: true });
});

app.get("/api/admin/users", auth, admin, async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const take = 12;
  const [items, total] = await Promise.all([
    prisma.user.findMany({ skip: (page - 1) * take, take, orderBy: { createdAt: "desc" }, include: { purchases: true, orders: true } }),
    prisma.user.count()
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / take) });
});

app.get("/api/admin/orders", auth, admin, async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const take = 12;
  const [items, total] = await Promise.all([
    prisma.order.findMany({ skip: (page - 1) * take, take, orderBy: { createdAt: "desc" }, include: { items: true, payments: true, booking: true } }),
    prisma.order.count()
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / take) });
});

app.get("/api/admin/contact-submissions", auth, admin, async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const take = 12;
  const [items, total] = await Promise.all([
    prisma.contactSubmission.findMany({ skip: (page - 1) * take, take, orderBy: { createdAt: "desc" } }),
    prisma.contactSubmission.count()
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / take) });
});

app.put("/api/admin/contact-submissions/:id/status", auth, admin, async (req, res) => {
  const data = z.object({ status: z.enum(["NEW", "CONTACTED", "CLOSED"]) }).parse(req.body);
  res.json(await prisma.contactSubmission.update({ where: { id: req.params.id }, data }));
});

app.put("/api/admin/orders/:id/status", auth, admin, async (req, res) => {
  const data = z.object({ status: z.string().min(2) }).parse(req.body);
  const stage = await prisma.crmStage.findUnique({ where: { key: data.status } });
  if (!stage) return res.status(400).json({ error: "Nie znaleziono etapu CRM." });
  res.json(await prisma.order.update({ where: { id: req.params.id }, data }));
});

app.get("/api/admin/bookings", auth, admin, async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const take = 24;
  const [items, total] = await Promise.all([
    prisma.booking.findMany({ skip: (page - 1) * take, take, orderBy: { startsAt: "asc" }, include: { course: true } }),
    prisma.booking.count()
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / take) });
});

app.get("/api/admin/availability-blocks", auth, admin, async (_req, res) => {
  res.json(await prisma.availabilityBlock.findMany({ orderBy: { startsAt: "asc" } }));
});

app.post("/api/admin/availability-blocks", auth, admin, async (req, res) => {
  const data = z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime(), note: z.string().optional().nullable() }).parse(req.body);
  res.status(201).json(await prisma.availabilityBlock.create({ data: { startsAt: new Date(data.startsAt), endsAt: new Date(data.endsAt), note: data.note || null } }));
});

app.delete("/api/admin/availability-blocks/:id", auth, admin, async (req, res) => {
  await prisma.availabilityBlock.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.get("/api/admin/integrations", auth, admin, async (_req, res) => {
  res.json(await prisma.integrationAccount.findMany({ orderBy: { createdAt: "desc" } }));
});

app.post("/api/admin/integrations", auth, admin, async (req, res) => {
  const data = z.object({ type: z.enum(["EMAIL", "GOOGLE"]), label: z.string().min(2), email: z.string().email().optional().nullable(), provider: z.string().min(2), config: z.string().default("{}"), active: z.boolean().optional() }).parse(req.body);
  res.status(201).json(await prisma.integrationAccount.create({ data: { ...data, active: data.active ?? true } }));
});

app.put("/api/admin/integrations/:id", auth, admin, async (req, res) => {
  const data = z.object({ type: z.enum(["EMAIL", "GOOGLE"]).optional(), label: z.string().min(2).optional(), email: z.string().email().optional().nullable(), provider: z.string().min(2).optional(), config: z.string().optional(), active: z.boolean().optional() }).parse(req.body);
  res.json(await prisma.integrationAccount.update({ where: { id: req.params.id }, data }));
});

app.delete("/api/admin/integrations/:id", auth, admin, async (req, res) => {
  await prisma.integrationAccount.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.get("/api/admin/crm-stages", auth, admin, async (_req, res) => {
  res.json(await prisma.crmStage.findMany({ orderBy: { sortOrder: "asc" } }));
});

app.post("/api/admin/crm-stages", auth, admin, async (req, res) => {
  const data = z.object({ name: z.string().min(2), color: z.string().default("#2f6d50") }).parse(req.body);
  const count = await prisma.crmStage.count();
  res.status(201).json(await prisma.crmStage.create({ data: { key: `CUSTOM_${Date.now()}`, name: data.name, color: data.color, sortOrder: count + 1 } }));
});

app.put("/api/admin/crm-stages/:id", auth, admin, async (req, res) => {
  const data = z.object({ name: z.string().min(2).optional(), color: z.string().optional(), sortOrder: z.number().int().optional() }).parse(req.body);
  res.json(await prisma.crmStage.update({ where: { id: req.params.id }, data }));
});

app.delete("/api/admin/crm-stages/:id", auth, admin, async (req, res) => {
  const stage = await prisma.crmStage.findUnique({ where: { id: req.params.id } });
  if (stage && ["DRAFT", "PAID", "CANCELED", "REFUNDED"].includes(stage.key)) return res.status(400).json({ error: "Tego etapu systemowego nie można usunąć." });
  await prisma.crmStage.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.post("/api/admin/uploads", auth, admin, upload.single("plik"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nie przesłano obrazu." });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

app.get("/api/admin/sections", auth, admin, async (_req, res) => res.json(await prisma.siteSection.findMany()));
app.put("/api/admin/sections/:id", auth, admin, async (req, res) => {
  const data = z.object({ title: z.string(), content: z.string(), data: z.string() }).parse(req.body);
  res.json(await prisma.siteSection.update({ where: { id: req.params.id }, data }));
});

app.post("/api/admin/pages", auth, admin, async (req, res) => {
  const data = z.object({ title: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/) }).parse(req.body);
  const page = await prisma.siteSection.create({
    data: {
      key: `page:${data.slug}`,
      title: data.title,
      content: `<section class="builder-hero"><div><p class="builder-label">nowa zakładka</p><h1>${data.title}</h1><p>Edytuj tę stronę w kreatorze.</p></div></section>`,
      data: JSON.stringify({ slug: data.slug, navLabel: data.title, css: "" })
    }
  });
  res.status(201).json(page);
});

app.delete("/api/admin/pages/:id", auth, admin, async (req, res) => {
  await prisma.siteSection.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.get("/api/admin/settings", auth, admin, async (_req, res) => {
  const settings = await prisma.setting.findMany();
  res.json(settings.map((item) => ({ ...item, value: item.secret && item.value ? "••••••••" : item.value })));
});

app.put("/api/admin/settings", auth, admin, async (req, res) => {
  const data = z.object({ key: z.string(), value: z.string() }).parse(req.body);
  const secret = data.key !== "stripe_publishable_key";
  await prisma.setting.upsert({ where: { key: data.key }, update: { value: data.value, secret }, create: { ...data, secret } });
  res.json({ ok: true });
});

app.get("/api/admin/database-config", auth, admin, async (_req, res) => {
  const row = await prisma.setting.findUnique({ where: { key: "database_url_external" } });
  res.json({
    currentRuntime: process.env.DATABASE_URL || "file:./dev.db",
    savedExternalUrl: row?.value || "",
    mode: "Demo działa na lokalnej bazie SQLite. Po wpisaniu zewnętrznego adresu zapisz ustawienie i użyj go jako DATABASE_URL przy deployu w Easypanel."
  });
});

app.put("/api/admin/database-config", auth, admin, async (req, res) => {
  const data = z.object({ url: z.string().min(4) }).parse(req.body);
  await prisma.setting.upsert({
    where: { key: "database_url_external" },
    update: { value: data.url, secret: true },
    create: { key: "database_url_external", value: data.url, secret: true }
  });
  res.json({ ok: true, message: "Zapisano konfigurację. Tabele zostaną utworzone komendą npm run migrate lub automatycznie przy starcie kontenera." });
});

app.use("/uploads", express.static(uploadPath, { maxAge: "30d" }));
app.use(express.static(path.join(__dirname, "..", "public"), { maxAge: "30d", index: false }));
app.use(express.static(distPath, { maxAge: "1y", index: false }));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Serwer działa: http://localhost:${port}`);
});
