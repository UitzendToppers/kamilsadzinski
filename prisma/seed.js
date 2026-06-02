import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const media = {
  portret: "https://kamilsadzinski.pl/wp-content/uploads/2026/03/cropped-IMG_0420-1-scaled-1.jpg",
  film: "https://kamilsadzinski.pl/wp-content/uploads/2026/03/strona.mp4",
  miniatura: "https://kamilsadzinski.pl/wp-content/uploads/2026/03/Hero-Video-Thumbnail.jpg",
  rynek: "https://kamilsadzinski.pl/wp-content/uploads/2026/03/pexels-photo-27759898-27759898-2048x1365.jpg",
  wnetrze: "https://kamilsadzinski.pl/wp-content/uploads/2026/03/pexels-photo-3678466-3678466-2048x1521.jpg",
  mieszkanie: "https://kamilsadzinski.pl/wp-content/uploads/2026/03/g2760fff4c137dd5bd7d0dfe57846914d3c2953d3f2c8a0e305de497358461f8f8defb1cd202527b6acb43e8599e016a317d85945196745d27b2fb0d860e72d71_1280-1845166.jpg",
  historia: "https://kamilsadzinski.pl/wp-content/uploads/2026/03/IMG_0414-683x1024.jpg",
  usmiech: "https://kamilsadzinski.pl/wp-content/uploads/2026/03/IMG_0425-683x1024.jpg",
  makieta: "https://kamilsadzinski.pl/wp-content/uploads/2026/03/Mockup_fixed_v2-1024x768.png"
};

const courses = [
  {
    slug: "calodniowy-kurs-online",
    badge: "okazja",
    title: "Całodniowy Kurs Online",
    summary: "Podstawy inwestowania w nieruchomości. Strategie oceny wartości i podejmowania świadomych decyzji inwestycyjnych.",
    description: "Podczas kursu poznasz solidne podstawy inwestowania w nieruchomości oraz zrozumiesz, jak działa rynek w praktyce. Nauczysz się analizować oferty, oceniać realną wartość mieszkań oraz identyfikować potencjalne okazje inwestycyjne.\n\nDowiesz się również, jakie czynniki wpływają na opłacalność inwestycji i jak podejmować świadome, przemyślane decyzje, które minimalizują ryzyko i zwiększają szanse na zysk.",
    priceCents: 9700,
    duration: "Cały dzień",
    level: "Dla każdego",
    imageUrl: media.rynek,
    sortOrder: 1
  },
  {
    slug: "konsultacja-online-11-60min",
    badge: "bestseller",
    title: "Konsultacja Online 1:1 - 60min",
    summary: "Ten indywidualny program coachingowy 1:1 jest stworzony dla osób, które chcą świadomie inwestować w nieruchomości lub podjąć dobrą decyzję zakupową.",
    description: "Uwaga - masz jeden dzień, aby zapisać się na szkolenie/spotkanie. Po tym czasie dostęp zostanie odebrany, więc nie czekaj i zarezerwuj termin od razu po zakupie!\n\nKonsultacja Online 1:1 - 60 minut Nieruchomości od A do Z\n\nTen indywidualny program coachingowy 1:1 jest stworzony dla osób, które chcą świadomie inwestować w nieruchomości lub podjąć dobrą decyzję zakupową - bez zgadywania i kosztownych błędów.\n\nPodczas współpracy skupiamy się bezpośrednio na Twojej sytuacji. Analizujemy Twoją obecną nieruchomość lub plan zakupu, oceniamy potencjalny zysk oraz ryzyko, a także identyfikujemy ewentualne problemy prawne, które mogą wpłynąć na inwestycję.\nNa tej podstawie tworzę dla Ciebie konkretną, dopasowaną strategię działania krok po kroku – tak, abyś wiedział/a dokładnie co robić dalej i podejmował/a decyzje z większą pewnością.\n\nTo praktyczna, konkretna praca 1:1, której celem są realne rezultaty - nie teoria.",
    priceCents: 49700,
    duration: "1h spotkania",
    level: "Dla każdego",
    imageUrl: media.wnetrze,
    sortOrder: 2
  },
  {
    slug: "flipy-od-zera-kurs-stacjonarny",
    badge: "bestseller",
    title: "Flipy od Zera - kurs stacjonarny",
    summary: "Jak znajdować okazje inwestycyjne, których nie ma na portalach ogłoszeniowych. Strategie pozyskiwania nieruchomości poniżej ceny rynkowej.",
    description: "Uwaga - masz jeden dzień, aby zapisać się na szkolenie/spotkanie. Po tym czasie dostęp zostanie odebrany, więc nie czekaj i zarezerwuj termin od razu po zakupie!\n\nFlipy od Zera - kurs stacjonarny\n\nTo nie jest kurs teoretyczny. Pokazuję dokładnie, jak wygląda flip w praktyce - od znalezienia okazji, przez analizę, aż po sprzedaż.",
    priceCents: 199700,
    duration: "3h spotkania",
    level: "Stacjonarne",
    imageUrl: media.mieszkanie,
    sortOrder: 3
  }
];

const modules = [
  ["Wprowadzenie do flipów", "Czym są flipy i jak działają w praktyce?\nIle realnie można zarobić?\nNajczęstsze błędy początkujących"],
  ["Jak znaleźć okazję?", "Gdzie szukać mieszkań (nie tylko portale)?\nJak odróżnić okazję od problemu?\nSzybka analiza inwestycji"],
  ["Formalności i finansowanie flipa", "Dokumenty i formalności przy zakupie mieszkania\nJak negocjować cenę i warunki transakcji?\nOpcje finansowania - kredyty, pożyczki, kapitał własny"],
  ["Planowanie i przeprowadzanie remontu", "Jak zaplanować remont pod sprzedaż z zyskiem?\nWybór wykonawców i nadzór nad remontem\nOszczędne i efektywne metody remontowe"],
  ["Sprzedaż mieszkania z zyskiem", "Jak przygotować mieszkanie do sprzedaży?\nJak wycenić mieszkanie i ustalić strategię sprzedaży?\nNegocjacje i finalizacja transakcji"],
  ["Podsumowanie i dalsze kroki", "Najczęstsze błędy i jak ich unikać\nBudowanie długoterminowej strategii flipowania\nŹródła wiedzy i dodatkowe materiały edukacyjne"],
  ["Q&A - sesja pytań i odpowiedzi", "Omówienie konkretnych przypadków uczestników\nRozwiązywanie realnych problemów inwestycyjnych\nOtwarta dyskusja i konsultacje"]
];

const sections = [
  {
    key: "strona-glowna",
    title: "Zbuduj Wolność Finansową na Nieruchomościach",
    content: "Naucz się inwestować, flipować i zarabiać na rynku nieruchomości, nawet jeśli zaczynasz od zera i bez kapitału. Praktyczna wiedza od praktyka z 5-letnim stażem.",
    data: JSON.stringify({ media, cytat: "\"Każdy może to osiągnąć. Potrzeba tylko wiedzy, determinacji i kogoś, kto pokaże drogę. Ja byłem tam, gdzie Ty jesteś teraz.\"" })
  },
  {
    key: "o-mnie",
    title: "Nie teoretyzuję. Praktykuję.",
    content: "Zaczynałem 5 lat temu od sourcingu, wyszukując okazje dla innych i ucząc się rynku od środka. Pierwszą nieruchomość kupiłem z inwestorem - bez własnych pieniędzy. Dziś zarządzam portfelem nieruchomości o wartości ponad 5 mln PLN.\n\nWierzę, że nieruchomości to najlepsza droga do wolności finansowej. Moim celem nie jest tylko sprzedaż kursów, ale budowa społeczności świadomych inwestorów, którzy zmieniają swoje życie dzięki mądrym decyzjom.",
    data: JSON.stringify({})
  },
  {
    key: "kontakt",
    title: "Kontakt",
    content: "Kamil Sadziński\nkontakt@kamilsadzinski.pl\nŁódź, Narutowicza 40/1 93-582 Łódź",
    data: "{}"
  },
  {
    key: "kreator-strony",
    title: "Kreator strony",
    content: "",
    data: JSON.stringify({ css: "" })
  }
];

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash, role: "ADMIN", name: "Administrator" },
    create: { email: "admin@example.com", passwordHash, role: "ADMIN", name: "Administrator" }
  });

  for (const section of sections) {
    await prisma.siteSection.upsert({ where: { key: section.key }, update: section, create: section });
  }

  for (const course of courses) {
    const saved = await prisma.course.upsert({ where: { slug: course.slug }, update: course, create: course });
    if (course.slug === "flipy-od-zera-kurs-stacjonarny") {
      await prisma.lesson.deleteMany({ where: { courseId: saved.id } });
      for (const [index, item] of modules.entries()) {
        await prisma.lesson.create({
          data: { courseId: saved.id, title: `Moduł ${index + 1}: ${item[0]}`, content: item[1], videoUrl: media.film, sortOrder: index + 1 }
        });
      }
    }
  }

  for (const setting of ["stripe_publishable_key", "stripe_secret_key", "stripe_webhook_secret"]) {
    await prisma.setting.upsert({
      where: { key: setting },
      update: {},
      create: { key: setting, value: "", secret: setting !== "stripe_publishable_key" }
    });
  }

  const stages = [
    ["DRAFT", "Nowe zgłoszenia", 1, "#2f6d50"],
    ["PAID", "Klienci po zakupie", 2, "#3d8a64"],
    ["CANCELED", "Do odzyskania", 3, "#b98535"],
    ["REFUNDED", "Zwroty", 4, "#9b3d3d"]
  ];
  for (const [key, name, sortOrder, color] of stages) {
    await prisma.crmStage.upsert({
      where: { key },
      update: { name, sortOrder, color },
      create: { key, name, sortOrder, color }
    });
  }

  const firstCourse = await prisma.course.findFirst({ orderBy: { sortOrder: "asc" } });
  if (firstCourse) {
    const demoUser = await prisma.user.upsert({
      where: { email: "klient-demo@example.com" },
      update: {},
      create: { email: "klient-demo@example.com", name: "Klient Demo", passwordHash: await bcrypt.hash("Demo123!", 12), role: "CUSTOMER" }
    });
    const booking = await prisma.booking.upsert({
      where: { id: "demo-booking-1" },
      update: {},
      create: {
        id: "demo-booking-1",
        courseId: firstCourse.id,
        name: "Klient Demo",
        email: "klient-demo@example.com",
        phone: "500 600 700",
        startsAt: new Date(Date.now() + 2 * 86400000),
        endsAt: new Date(Date.now() + 2 * 86400000 + 60 * 60000),
        status: "CONFIRMED",
        note: "Przykładowy booking do prezentacji"
      }
    });
    const order = await prisma.order.upsert({
      where: { number: "KS-DEMO-001" },
      update: {},
      create: {
        number: "KS-DEMO-001",
        userId: demoUser.id,
        bookingId: booking.id,
        email: "klient-demo@example.com",
        name: "Klient Demo",
        totalCents: firstCourse.priceCents,
        status: "PAID",
        items: { create: { courseId: firstCourse.id, title: firstCourse.title, priceCents: firstCourse.priceCents } },
        payments: { create: { amountCents: firstCourse.priceCents, status: "SUCCEEDED", providerId: "demo-payment-001", payload: JSON.stringify({ demo: true, method: "BLIK" }) } }
      }
    });
    await prisma.purchase.upsert({
      where: { userId_courseId: { userId: demoUser.id, courseId: firstCourse.id } },
      update: {},
      create: { userId: demoUser.id, courseId: firstCourse.id }
    });
    await prisma.contactSubmission.upsert({
      where: { id: "demo-form-1" },
      update: {},
      create: {
        id: "demo-form-1",
        name: "Anna Demo",
        email: "anna-demo@example.com",
        phone: "501 202 303",
        topic: "Pytanie o kurs",
        message: "Dzień dobry, chciałabym dowiedzieć się więcej o kursie i terminach konsultacji.",
        status: "NEW"
      }
    });
    await prisma.pageView.create({ data: { path: "/", referrer: "demo", userAgent: "demo", ip: "127.0.0.1" } });
    void order;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed zakończony. Administrator: admin@example.com / Admin123!");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
