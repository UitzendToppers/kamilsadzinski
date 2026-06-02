# Platforma kursowa

Jedna aplikacja: React, Node.js, Prisma, panel administracyjny, CRM, sprzedaż kursów i integracja Stripe.

## Uruchomienie lokalne

```bash
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
```

Panel: `http://localhost:5173`, zakładka `Panel`.

Administrator:

- login: `admin@example.com`
- hasło: `Admin123!`

## Wdrożenie

Projekt jest gotowy pod Easypanel jako aplikacja Docker. W zmiennych środowiskowych ustaw:

- `DATABASE_URL`
- `JWT_SECRET`
- `PUBLIC_URL`

Stripe ustawiasz w panelu administracyjnym w zakładce płatności:

- `stripe_publishable_key`
- `stripe_secret_key`
- `stripe_webhook_secret`

Adres webhooka: `/api/stripe/webhook`.
