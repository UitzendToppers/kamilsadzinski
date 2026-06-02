import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const apiUrl = import.meta.env.VITE_API_URL || "/api";
const statusy = [
  ["DRAFT", "Nowe zgłoszenia"],
  ["PAID", "Klienci po zakupie"],
  ["CANCELED", "Do odzyskania"],
  ["REFUNDED", "Zwroty"]
];

function pieniadze(grosze = 0) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(grosze / 100);
}

async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    credentials: "include"
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Błąd połączenia.");
  return response.json();
}

function stronyZKreatora(sections = []) {
  return sections
    .filter((section) => section.key?.startsWith("page:"))
    .map((section) => ({ ...section, json: JSON.parse(section.data || "{}") }));
}

function Nawigacja({ pages = [] }) {
  const [menuOtwarte, setMenuOtwarte] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("menuMobileAktywne", menuOtwarte);
    return () => document.body.classList.remove("menuMobileAktywne");
  }, [menuOtwarte]);
  const linki = [
    ["/", "Strona Główna"],
    ["/#o-mnie", "O mnie"],
    ["/#szkolenia", "Szkolenia"],
    ["/kontakt", "Kontakt"],
    ...pages.map((page) => [`/${page.json.slug}`, page.json.navLabel || page.title])
  ];
  return (
    <header className="nawigacja">
      <a className="logo" href="/">
        <img src="/logokamil.png" alt="Kamil Sadziński" />
      </a>
      <nav>
        {linki.map(([href, label]) => <a href={href} key={href}>{label}</a>)}
      </nav>
      <button className="menuMobileButton" onClick={() => setMenuOtwarte(true)} aria-label="Otwórz menu">
        <span />
        <span />
        <span />
      </button>
      <div className={`drawerMobile ${menuOtwarte ? "otwarty" : ""}`}>
        <div className="drawerTop">
          <img src="/logokamil.png" alt="Kamil Sadziński" />
          <button onClick={() => setMenuOtwarte(false)} aria-label="Zamknij menu">×</button>
        </div>
        <div className="drawerLinki">
          {linki.map(([href, label], index) => <a href={href} onClick={() => setMenuOtwarte(false)} style={{ animationDelay: `${index * 55}ms` }} key={href}>{label}</a>)}
        </div>
        <div className="drawerStopka">
          <span>Inwestowanie w nieruchomości</span>
          <strong>Kamil Sadziński</strong>
        </div>
      </div>
    </header>
  );
}

function Strona({ dane, setWidok, setWybrany }) {
  const [dzwiek, setDzwiek] = useState(true);
  const sekcje = Object.fromEntries((dane.sections || []).map((s) => [s.key, { ...s, json: JSON.parse(s.data || "{}") }]));
  const start = sekcje["strona-glowna"];
  const omnie = sekcje["o-mnie"];
  const kontakt = sekcje.kontakt;
  const kreator = sekcje["kreator-strony"];
  return (
    <main>
      <section className="hero wejscie">
        <div className="heroTekst">
          <p className="etykieta">Inwestor, Mentor, Przedsiębiorca</p>
          <h1>{start?.title}</h1>
          <p>{start?.content}</p>
          <div className="akcje">
            <a className="przycisk" href="#szkolenia">Zobacz szkolenia</a>
            <a className="przycisk drugi" href="#o-mnie">Poznaj mnie bliżej</a>
          </div>
        </div>
        <div className="heroMedia">
          <video poster={start?.json.media?.miniatura} src={start?.json.media?.film} autoPlay muted={!dzwiek} loop playsInline />
          <button className="dzwiekVideo" onClick={() => setDzwiek(!dzwiek)} aria-label={dzwiek ? "Wycisz film" : "Włącz dźwięk"}>{dzwiek ? "🔊" : "🔇"}</button>
          <div className="metryki szklo">
            <span><b>5+</b> Lat doświadczenia</span>
            <span><b>150+</b> Zrealizowanych flipów</span>
            <span><b>45 mln</b> Obrót kapitałem</span>
          </div>
        </div>
      </section>

      <section className="pas" id="o-mnie">
        <div className="wejscie">
          <p className="etykieta">O mnie i o biznesie</p>
          <h2>{omnie?.title}</h2>
          {omnie?.content.split("\n\n").map((akapit) => <p key={akapit}>{akapit}</p>)}
        </div>
        <img className="zdjeciePremium" src={start?.json.media?.portret} alt="Kamil Sadziński" loading="lazy" />
      </section>

      <section className="siatkaInfo">
        {[
          ["Czy te szkolenia są dla Ciebie?", "Niezależnie od tego, w jakim punkcie startowym się znajdujesz, przygotowałem ścieżkę, która doprowadzi Cię do celu."],
          ["Kompletna wiedza od A do Z", "Analiza Nieruchomości, Wyszukiwanie Okazji, Flipowanie Krok po Kroku i Mistrzowskie Negocjacje."],
          ["Wszystko czego potrzebujesz w jednym miejscu", "Platforma dostępna 24/7 na każdym urządzeniu. Ucz się we własnym tempie, gdziekolwiek jesteś."]
        ].map((item, index) => (
          <article className="kafelek wejscie" style={{ animationDelay: `${index * 90}ms` }} key={item[0]}>
            <span>0{index + 1}</span>
            <h3>{item[0]}</h3>
            <p>{item[1]}</p>
          </article>
        ))}
      </section>

      <section className="kursy" id="szkolenia">
        <div className="naglowekSekcji">
          <p className="etykieta">sklep</p>
          <h2>Wybierz swoją ścieżkę</h2>
        </div>
        <div className="listaKursow">
          {dane.courses?.map((kurs, index) => (
            <article className="kurs wejscie" style={{ animationDelay: `${index * 120}ms` }} key={kurs.id}>
              <img src={kurs.imageUrl} alt={kurs.title} loading="lazy" />
              <div className="kursTresc">
                <span>{kurs.badge}</span>
                <h3>{kurs.title}</h3>
                <strong>{pieniadze(kurs.priceCents)}</strong>
                <p>{kurs.summary}</p>
                <small>{kurs.duration} · {kurs.level}</small>
                <button className="przycisk" onClick={() => { setWybrany(kurs); setWidok("kurs"); window.scrollTo(0, 0); }}>Kup teraz</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="faq">
        <h2>Najczęściej zadawane pytania</h2>
        {[
          ["Czy ten kurs jest dla początkujących?", "Tak. Kurs jest zbudowany od zera - pokazuję dokładnie, jak zacząć i przejść cały proces na podstawie mojego doświadczenia."],
          ["Czy potrzebuję dużego kapitału na start?", "Nie. Możesz zacząć bez własnych pieniędzy, np. jako sourcer i zarabiać na wyszukiwaniu okazji dla inwestorów."],
          ["Czy mogę działać w nieruchomościach, pracując na etacie?", "Tak. Da się to pogodzić - pokazuję modele, które można robić po godzinach."],
          ["Czy dostanę gotowe schematy działania?", "Tak. Dostajesz konkretne kroki, checklisty i procesy, które możesz od razu wdrożyć."]
        ].map((item) => <details key={item[0]}><summary>{item[0]}</summary><p>{item[1]}</p></details>)}
      </section>

      {kreator?.content && (
        <section className="sekcjaKreatora">
          <style>{kreator.json.css || ""}</style>
          <div dangerouslySetInnerHTML={{ __html: kreator.content }} />
        </section>
      )}

      <footer id="kontakt">
        <div className="stopkaWnetrze">
          <img src="/logokamil.png" alt="Kamil Sadziński" />
          <div>
            <h2>Zacznij budować swoją przyszłość już dziś</h2>
            <p>Nie czekaj na "idealny moment". Rynek nieruchomości ucieka. Dołącz do grona inwestorów i zrealizuj swój pierwszy zyskowny projekt w tym roku.</p>
          </div>
          <div className="kontaktStopka">
            <strong>{kontakt?.title}</strong>
            <p>{kontakt?.content}</p>
          </div>
        </div>
        <div className="dolStopki">© 2026 Kamil Sadziński. Wszelkie prawa zastrzeżone.</div>
      </footer>
    </main>
  );
}

function DynamicPage({ page }) {
  if (!page) return <main className="widokKursu"><h1>Nie znaleziono strony</h1></main>;
  const data = JSON.parse(page.data || "{}");
  return (
    <main className="sekcjaKreatora">
      <style>{data.css || domyslnyCssKreatora()}</style>
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </main>
  );
}

function Kurs({ kurs, setWidok }) {
  const [formularz, setFormularz] = useState({ name: "", email: "", phone: "", startsAt: "" });
  const [sloty, setSloty] = useState([]);
  const [komunikat, setKomunikat] = useState("");
  useEffect(() => {
    api("/availability").then((data) => {
      setSloty(data.slots || []);
      if (data.slots?.[0]) setFormularz((current) => ({ ...current, startsAt: data.slots[0].startsAt }));
    });
  }, []);
  async function zamow() {
    const booking = await api("/bookings", { method: "POST", body: JSON.stringify({ courseId: kurs.id, ...formularz }) });
    const wynik = await api("/orders", { method: "POST", body: JSON.stringify({ courseId: kurs.id, name: formularz.name, email: formularz.email, bookingId: booking.booking.id }) });
    setKomunikat(wynik.payment ? "Zamówienie utworzone. Płatność jest gotowa do obsługi po podłączeniu formularza płatniczego." : wynik.message);
  }
  return (
    <main className="widokKursu">
      <button className="linkowy" onClick={() => setWidok("start")}>Wróć do strony</button>
      <section className="detal wejscie">
        <img src={kurs.imageUrl} alt={kurs.title} />
        <div>
          <span className="etykieta">{kurs.badge}</span>
          <h1>{kurs.title}</h1>
          <strong>{pieniadze(kurs.priceCents)}</strong>
          {kurs.description.split("\n\n").map((akapit) => <p key={akapit}>{akapit}</p>)}
          <div className="lekcje">
            {kurs.lessons?.map((l) => <details key={l.id}><summary>{l.title}</summary><p>{l.content}</p></details>)}
          </div>
          <div className="formularz">
            <input placeholder="Imię i nazwisko" value={formularz.name} onChange={(e) => setFormularz({ ...formularz, name: e.target.value })} />
            <input placeholder="Adres e-mail" value={formularz.email} onChange={(e) => setFormularz({ ...formularz, email: e.target.value })} />
            <input placeholder="Telefon" value={formularz.phone} onChange={(e) => setFormularz({ ...formularz, phone: e.target.value })} />
            <select value={formularz.startsAt} onChange={(e) => setFormularz({ ...formularz, startsAt: e.target.value })}>
              {sloty.map((slot) => <option value={slot.startsAt} key={slot.startsAt}>{new Date(slot.startsAt).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}</option>)}
            </select>
            <div className="checkoutPreview">
              {["BLIK", "Karta", "Apple Pay", "Google Pay", "PayPal"].map((method) => <button type="button" key={method}>{method}</button>)}
            </div>
            <button className="przycisk" onClick={zamow}>Kup teraz</button>
          </div>
          {komunikat && <p className="komunikat">{komunikat}</p>}
        </div>
      </section>
    </main>
  );
}

function KontaktPage({ dane }) {
  const sekcje = Object.fromEntries((dane.sections || []).map((s) => [s.key, { ...s, json: JSON.parse(s.data || "{}") }]));
  const kontakt = sekcje.kontakt;
  const start = sekcje["strona-glowna"];
  const [formularz, setFormularz] = useState({ name: "", email: "", phone: "", topic: "Konsultacja nieruchomości", message: "" });
  const [komunikat, setKomunikat] = useState("");

  async function wyslij(e) {
    e.preventDefault();
    const wynik = await api("/contact", { method: "POST", body: JSON.stringify(formularz) });
    setKomunikat(wynik.message);
    setFormularz({ name: "", email: "", phone: "", topic: "Konsultacja nieruchomości", message: "" });
  }

  return (
    <main className="stronaKontaktu">
      <section className="kontaktHero">
        <div>
          <p className="etykieta">kontakt</p>
          <h1>Porozmawiajmy o nieruchomościach</h1>
          <p>Masz pytanie o kurs, konsultację albo konkretną inwestycję? Napisz wiadomość, a zgłoszenie trafi bezpośrednio do panelu obsługi.</p>
          <div className="kontaktDane">
            <strong>{kontakt?.title}</strong>
            <p>{kontakt?.content}</p>
          </div>
        </div>
        <img src={start?.json?.media?.portret} alt="Kamil Sadziński" />
      </section>

      <section className="kontaktFormularzSekcja">
        <form className="kontaktFormularz" onSubmit={wyslij}>
          <label>Imię i nazwisko<input required value={formularz.name} onChange={(e) => setFormularz({ ...formularz, name: e.target.value })} /></label>
          <label>Adres e-mail<input required type="email" value={formularz.email} onChange={(e) => setFormularz({ ...formularz, email: e.target.value })} /></label>
          <label>Telefon<input value={formularz.phone} onChange={(e) => setFormularz({ ...formularz, phone: e.target.value })} /></label>
          <label>Temat<select value={formularz.topic} onChange={(e) => setFormularz({ ...formularz, topic: e.target.value })}>
            <option>Konsultacja nieruchomości</option>
            <option>Pytanie o kurs</option>
            <option>Współpraca</option>
            <option>Inna sprawa</option>
          </select></label>
          <label className="pelne">Wiadomość<textarea required value={formularz.message} onChange={(e) => setFormularz({ ...formularz, message: e.target.value })} /></label>
          <button className="przycisk" type="submit">Wyślij wiadomość</button>
          {komunikat && <p className="komunikat">{komunikat}</p>}
        </form>
      </section>

      <section className="mapaKontakt">
        <div>
          <p className="etykieta">dojazd</p>
          <h2>Łódź, Narutowicza 40/1</h2>
        </div>
        <iframe
          title="Mapa dojazdu - Kamil Sadziński"
          loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=19.4524%2C51.7685%2C19.4624%2C51.7735&layer=mapnik&marker=51.77098%2C19.4576"
        />
      </section>

      <footer id="kontakt">
        <div className="stopkaWnetrze">
          <img src="/logokamil.png" alt="Kamil Sadziński" />
          <div>
            <h2>Zacznij budować swoją przyszłość już dziś</h2>
            <p>Nie czekaj na "idealny moment". Rynek nieruchomości ucieka. Dołącz do grona inwestorów i zrealizuj swój pierwszy zyskowny projekt w tym roku.</p>
          </div>
          <div className="kontaktStopka">
            <strong>{kontakt?.title}</strong>
            <p>{kontakt?.content}</p>
          </div>
        </div>
        <div className="dolStopki">© 2026 Kamil Sadziński. Wszelkie prawa zastrzeżone.</div>
      </footer>
    </main>
  );
}

function Panel() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [login, setLogin] = useState({ email: "admin@example.com", password: "Admin123!" });
  const [tab, setTab] = useState("dashboard");
  const [dane, setDane] = useState({});
  const [strony, setStrony] = useState({ klienci: 1, zamowienia: 1, formularze: 1, bookingi: 1 });
  const [przeciagany, setPrzeciagany] = useState(null);

  async function zaloguj() {
    const wynik = await api("/auth/login", { method: "POST", body: JSON.stringify(login) });
    localStorage.setItem("token", wynik.token);
    setToken(wynik.token);
  }

  async function pobierz() {
    if (!token) return;
    const [dashboard, courses, users, orders, submissions, bookings, integrations, stages, settings, sections] = await Promise.all([
      api("/admin/dashboard"),
      api("/admin/courses"),
      api(`/admin/users?page=${strony.klienci}`),
      api(`/admin/orders?page=${strony.zamowienia}`),
      api(`/admin/contact-submissions?page=${strony.formularze}`),
      api(`/admin/bookings?page=${strony.bookingi}`),
      api("/admin/integrations"),
      api("/admin/crm-stages"),
      api("/admin/settings"),
      api("/admin/sections")
    ]);
    setDane({ dashboard, courses, users, orders, submissions, bookings, integrations, stages, settings, sections });
  }

  useEffect(() => { pobierz(); }, [token, strony.klienci, strony.zamowienia, strony.formularze, strony.bookingi]);

  async function zapiszKurs(kurs) {
    await api(`/admin/courses/${kurs.id}`, { method: "PUT", body: JSON.stringify(kurs) });
    pobierz();
  }

  async function wgrajObraz(kurs, plik) {
    const body = new FormData();
    body.append("plik", plik);
    const wynik = await api("/admin/uploads", { method: "POST", body });
    await zapiszKurs({ ...kurs, imageUrl: wynik.url });
  }

  async function upusc(id) {
    const lista = [...dane.courses];
    const from = lista.findIndex((x) => x.id === przeciagany);
    const to = lista.findIndex((x) => x.id === id);
    if (from < 0 || to < 0) return;
    const [item] = lista.splice(from, 1);
    lista.splice(to, 0, item);
    setDane({ ...dane, courses: lista });
    await api("/admin/courses/reorder", { method: "POST", body: JSON.stringify({ ids: lista.map((x) => x.id) }) });
  }

  async function zapiszUstawienie(key, value) {
    await api("/admin/settings", { method: "PUT", body: JSON.stringify({ key, value }) });
    pobierz();
  }

  async function zmienStatus(id, status) {
    await api(`/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    pobierz();
  }

  async function zmienStatusFormularza(id, status) {
    await api(`/admin/contact-submissions/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    pobierz();
  }

  if (!token) {
    return (
      <main className="panelLogowania">
        <img src="/logokamil.png" alt="Kamil Sadziński" />
        <h1>Panel administracyjny</h1>
        <input value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
        <input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
        <button className="przycisk" onClick={zaloguj}>Zaloguj</button>
      </main>
    );
  }

  return (
    <main className="panel">
      <aside>
        <img src="/logokamil.png" alt="Kamil Sadziński" />
        {["dashboard", "CRM", "treści", "ustawienia"].map((x) => (
          <button className={tab === x ? "aktywny" : ""} onClick={() => setTab(x)} key={x}>{x}</button>
        ))}
      </aside>
      <section className="roboczy">
        {tab === "dashboard" && <Dashboard dane={dane.dashboard} />}
        {tab === "CRM" && <CrmPanel dane={dane} strony={strony} setStrony={setStrony} zmienStatus={zmienStatus} zmienStatusFormularza={zmienStatusFormularza} pobierz={pobierz} />}
        {tab === "treści" && <KreatorStrony sections={dane.sections || []} courses={dane.courses || []} pobierz={pobierz} />}
        {tab === "ustawienia" && <UstawieniaPanel dane={dane} strony={strony} setStrony={setStrony} zapiszKurs={zapiszKurs} wgrajObraz={wgrajObraz} setPrzeciagany={setPrzeciagany} upusc={upusc} zapiszUstawienie={zapiszUstawienie} pobierz={pobierz} />}
      </section>
    </main>
  );
}

function Dashboard({ dane = {} }) {
  return (
    <div className="dashboardNowy">
      <div className="dashboardHero">
        <div>
          <p className="etykieta">centrum dowodzenia</p>
          <h1>Dashboard</h1>
          <p>Sprzedaż, leady, bookingi i ruch strony w jednym miejscu.</p>
        </div>
        <div className="livePuls">
          <span />
          <b>{dane.liveViews || 0}</b>
          <small>wejść w ostatniej godzinie</small>
        </div>
      </div>
      <div className="metryki adminMetryki dashboardMetryki">
        <span><b>{pieniadze(dane.revenueCents || 0)}</b>Przychód</span>
        <span><b>{dane.orders || 0}</b>Zamówienia</span>
        <span><b>{dane.submissions || 0}</b>Formularze</span>
        <span><b>{dane.bookings || 0}</b>Bookingi</span>
        <span><b>{dane.todayViews || 0}</b>Ruch dzisiaj</span>
        <span><b>{dane.conversionRate || 0}%</b>Konwersja</span>
        <span><b>{dane.users || 0}</b>Użytkownicy</span>
        <span><b>{dane.courses || 0}</b>Kursy</span>
      </div>
      <div className="ostatnieTransakcje">
        <h2>Ostatnie transakcje</h2>
        {(dane.recentOrders || []).map((order) => (
          <article key={order.id}>
            <strong>{order.number}</strong>
            <span>{order.email}</span>
            <b>{pieniadze(order.totalCents)}</b>
            <small>{order.status}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function KursyAdmin({ kursy, zapiszKurs, wgrajObraz, setPrzeciagany, upusc }) {
  return (
    <div>
      <h1>Kursy i oferta</h1>
      <div className="kursyAdmin">
        {kursy.map((kurs) => (
          <article draggable onDragStart={() => setPrzeciagany(kurs.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => upusc(kurs.id)} key={kurs.id}>
            <img src={kurs.imageUrl} alt={kurs.title} />
            <div className="formularzAdmin">
              <label>Nazwa kursu<input value={kurs.title} onChange={(e) => zapiszKurs({ ...kurs, title: e.target.value })} /></label>
              <label>Opis skrócony<textarea value={kurs.summary} onChange={(e) => zapiszKurs({ ...kurs, summary: e.target.value })} /></label>
              <label>Cena w groszach<input type="number" value={kurs.priceCents} onChange={(e) => zapiszKurs({ ...kurs, priceCents: Number(e.target.value) })} /></label>
              <label>Adres obrazu<input value={kurs.imageUrl || ""} onChange={(e) => zapiszKurs({ ...kurs, imageUrl: e.target.value })} /></label>
              <label className="plik">Wgraj obraz z komputera<input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && wgrajObraz(kurs, e.target.files[0])} /></label>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ListaZPaginacja({ dane, pola, format = {}, strona, setStrona }) {
  return (
    <div>
      <div className="tabela">{(dane?.items || []).map((item) => <article key={item.id}>{pola.map((p) => <span key={p}>{format[p] ? format[p](item[p]) : item[p]}</span>)}</article>)}</div>
      <div className="paginacja">
        <button disabled={strona <= 1} onClick={() => setStrona(strona - 1)}>Poprzednia</button>
        <span>Strona {dane?.page || strona} z {dane?.pages || 1}</span>
        <button disabled={strona >= (dane?.pages || 1)} onClick={() => setStrona(strona + 1)}>Następna</button>
      </div>
    </div>
  );
}

function FormularzeAdmin({ dane, strona, setStrona, zmienStatus }) {
  const etykiety = {
    NEW: "Nowe",
    CONTACTED: "Po kontakcie",
    CLOSED: "Zamknięte"
  };
  return (
    <div>
      <h1>Przychodzące formularze</h1>
      <div className="formularzeLista">
        {(dane?.items || []).map((item) => (
          <article key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.email}</span>
              {item.phone && <span>{item.phone}</span>}
            </div>
            <div>
              <b>{item.topic}</b>
              <p>{item.message}</p>
            </div>
            <div>
              <small>{new Date(item.createdAt).toLocaleString("pl-PL")}</small>
              <select value={item.status} onChange={(e) => zmienStatus(item.id, e.target.value)}>
                {Object.entries(etykiety).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </div>
          </article>
        ))}
      </div>
      <div className="paginacja">
        <button disabled={strona <= 1} onClick={() => setStrona(strona - 1)}>Poprzednia</button>
        <span>Strona {dane?.page || strona} z {dane?.pages || 1}</span>
        <button disabled={strona >= (dane?.pages || 1)} onClick={() => setStrona(strona + 1)}>Następna</button>
      </div>
    </div>
  );
}

function UstawieniaPanel({ dane, strony, setStrony, zapiszKurs, wgrajObraz, setPrzeciagany, upusc, zapiszUstawienie, pobierz }) {
  const [podstrona, setPodstrona] = useState("sklep");
  return (
    <div className="modulPanelu">
      <div className="podmenu">
        {["sklep", "kalendarz", "integracje", "płatności", "baza danych"].map((item) => <button className={podstrona === item ? "aktywny" : ""} onClick={() => setPodstrona(item)} key={item}>{item}</button>)}
      </div>
      {podstrona === "sklep" && (
        <div className="ustawieniaGrid">
          <section>
            <KursyAdmin kursy={dane.courses || []} zapiszKurs={zapiszKurs} wgrajObraz={wgrajObraz} setPrzeciagany={setPrzeciagany} upusc={upusc} />
          </section>
          <aside className="sklepBok">
            <PaymentPreview />
            <section className="ostatnieTransakcje">
              <h2>Ostatnie transakcje</h2>
              {(dane.dashboard?.recentOrders || []).map((order) => <article key={order.id}><strong>{order.number}</strong><span>{order.email}</span><b>{pieniadze(order.totalCents)}</b><small>{order.status}</small></article>)}
            </section>
          </aside>
        </div>
      )}
      {podstrona === "kalendarz" && <KalendarzAdmin bookings={dane.bookings} strona={strony.bookingi} setStrona={(v) => setStrony({ ...strony, bookingi: v })} pobierz={pobierz} />}
      {podstrona === "integracje" && <IntegracjeAdmin accounts={dane.integrations || []} pobierz={pobierz} />}
      {podstrona === "płatności" && <Platnosci settings={dane.settings || []} zapisz={zapiszUstawienie} />}
      {podstrona === "baza danych" && <BazaDanychAdmin />}
    </div>
  );
}

function BazaDanychAdmin() {
  const [config, setConfig] = useState({ currentRuntime: "", savedExternalUrl: "", mode: "" });
  const [url, setUrl] = useState("");
  const [komunikat, setKomunikat] = useState("");
  useEffect(() => {
    api("/admin/database-config").then((data) => {
      setConfig(data);
      setUrl(data.savedExternalUrl || "");
    });
  }, []);
  async function zapisz() {
    const wynik = await api("/admin/database-config", { method: "PUT", body: JSON.stringify({ url }) });
    setKomunikat(wynik.message);
  }
  return (
    <div className="bazaDanychPanel">
      <section className="instrukcja">
        <h1>Baza danych</h1>
        <p>{config.mode}</p>
        <p>Aktualny tryb uruchomienia: <b>{config.currentRuntime}</b></p>
        <ol>
          <li>W Easypanel utwórz bazę PostgreSQL albo zostaw lokalny SQLite dla demo.</li>
          <li>Wklej adres połączenia, np. <code>postgresql://user:haslo@host:5432/baza</code>.</li>
          <li>Przy deployu ustaw ten adres jako zmienną środowiskową <code>DATABASE_URL</code>.</li>
          <li>Kontener uruchomi migracje i seed automatycznie przy starcie.</li>
        </ol>
      </section>
      <section className="formularzAdmin">
        <label>Adres DATABASE_URL<input value={url} onChange={(e) => setUrl(e.target.value)} /></label>
        <button className="przycisk" onClick={zapisz}>Zapisz konfigurację</button>
        {komunikat && <p className="komunikat">{komunikat}</p>}
      </section>
    </div>
  );
}

function PaymentPreview() {
  return (
    <section className="paymentPreview">
      <h2>Podgląd płatności live</h2>
      <div className="payBox">
        <div className="payTotal"><span>Do zapłaty</span><b>497 zł</b></div>
        {["BLIK", "Karta", "Apple Pay", "Google Pay", "PayPal"].map((method) => (
          <button key={method}><span>{method}</span><small>{method === "BLIK" ? "Kod 6-cyfrowy" : "Płatność natychmiastowa"}</small></button>
        ))}
      </div>
    </section>
  );
}

function KalendarzAdmin({ bookings, strona, setStrona, pobierz }) {
  const [blokada, setBlokada] = useState({ startsAt: "", endsAt: "", note: "" });
  const [blokady, setBlokady] = useState([]);
  const [month, setMonth] = useState(new Date());
  useEffect(() => { api("/admin/availability-blocks").then(setBlokady).catch(() => {}); }, []);
  const dni = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [month]);
  async function dodajBlokade() {
    await api("/admin/availability-blocks", { method: "POST", body: JSON.stringify({ ...blokada, startsAt: new Date(blokada.startsAt).toISOString(), endsAt: new Date(blokada.endsAt).toISOString() }) });
    setBlokada({ startsAt: "", endsAt: "", note: "" });
    const data = await api("/admin/availability-blocks");
    setBlokady(data);
    pobierz();
  }
  async function usunBlokade(id) {
    await api(`/admin/availability-blocks/${id}`, { method: "DELETE" });
    setBlokady(await api("/admin/availability-blocks"));
    pobierz();
  }
  async function zablokujDzien(day) {
    const startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9);
    const endsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 18);
    await api("/admin/availability-blocks", { method: "POST", body: JSON.stringify({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), note: "Zajęty dzień" }) });
    setBlokady(await api("/admin/availability-blocks"));
    pobierz();
  }
  async function zablokujWeekendy() {
    for (const day of dni.filter((d) => d.getMonth() === month.getMonth() && [0, 6].includes(d.getDay()))) {
      const startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0);
      const endsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59);
      await api("/admin/availability-blocks", { method: "POST", body: JSON.stringify({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), note: "Weekend" }) });
    }
    setBlokady(await api("/admin/availability-blocks"));
    pobierz();
  }
  function czyZajety(day) {
    return blokady.some((item) => new Date(item.startsAt).toDateString() === day.toDateString());
  }
  return (
    <div className="kalendarzAdmin">
      <section className="instrukcja">
        <h1>Kalendarz dostępności</h1>
        <p>Dodaj dni i godziny, w których administrator jest zajęty. Front automatycznie ukryje te terminy przed bookingiem kursu. Bookingi z checkoutu pojawiają się poniżej.</p>
      </section>
      <section className="formularzAdmin kalendarzForm">
        <label>Początek blokady<input type="datetime-local" value={blokada.startsAt} onChange={(e) => setBlokada({ ...blokada, startsAt: e.target.value })} /></label>
        <label>Koniec blokady<input type="datetime-local" value={blokada.endsAt} onChange={(e) => setBlokada({ ...blokada, endsAt: e.target.value })} /></label>
        <label>Opis<input value={blokada.note} onChange={(e) => setBlokada({ ...blokada, note: e.target.value })} /></label>
        <button className="przycisk" onClick={dodajBlokade}>Dodaj zajęty termin</button>
      </section>
      <section className="kalendarzSiatka">
        <div className="kalendarzNaglowek">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Poprzedni</button>
          <h2>{month.toLocaleString("pl-PL", { month: "long", year: "numeric" })}</h2>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Następny</button>
          <button onClick={zablokujWeekendy}>Zajmij weekendy</button>
        </div>
        <div className="dniTygodnia">{["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="dniMiesiaca">
          {dni.map((day) => <button className={`${day.getMonth() !== month.getMonth() ? "poza" : ""} ${czyZajety(day) ? "zajety" : ""}`} onClick={() => zablokujDzien(day)} key={day.toISOString()}>{day.getDate()}</button>)}
        </div>
      </section>
      <section className="dwieKolumny">
        <div className="listaMini">
          <h2>Zajęte terminy</h2>
          {blokady.map((item) => <article key={item.id}><span>{new Date(item.startsAt).toLocaleString("pl-PL")} - {new Date(item.endsAt).toLocaleString("pl-PL")}</span><small>{item.note}</small><button onClick={() => usunBlokade(item.id)}>Usuń</button></article>)}
        </div>
        <div className="listaMini">
          <h2>Bookingi kursów</h2>
          {(bookings?.items || []).map((item) => <article key={item.id}><strong>{item.name}</strong><span>{item.email}</span><b>{item.course?.title}</b><small>{new Date(item.startsAt).toLocaleString("pl-PL")}</small></article>)}
          <div className="paginacja"><button disabled={strona <= 1} onClick={() => setStrona(strona - 1)}>Poprzednia</button><span>{bookings?.page || strona} / {bookings?.pages || 1}</span><button disabled={strona >= (bookings?.pages || 1)} onClick={() => setStrona(strona + 1)}>Następna</button></div>
        </div>
      </section>
    </div>
  );
}

function IntegracjeAdmin({ accounts, pobierz }) {
  const [form, setForm] = useState({ type: "EMAIL", label: "", email: "", provider: "SMTP", config: "{}" });
  async function dodaj() {
    await api("/admin/integrations", { method: "POST", body: JSON.stringify(form) });
    setForm({ type: "EMAIL", label: "", email: "", provider: "SMTP", config: "{}" });
    pobierz();
  }
  async function usun(id) {
    await api(`/admin/integrations/${id}`, { method: "DELETE" });
    pobierz();
  }
  return (
    <div className="integracjeAdmin">
      <section className="instrukcja">
        <h1>Integracje e-mail i Google</h1>
        <p>Możesz podłączyć kilka skrzynek i kilka kont Google. Formularze kontaktowe, zakupy kursów oraz bookingi mogą później wysyłać wiadomości z wybranego konta i synchronizować terminy z wybranym kalendarzem.</p>
        <ol>
          <li>Dla e-mail: utwórz hasło aplikacji w swojej poczcie, wybierz SMTP i wpisz dane w polu konfiguracji JSON.</li>
          <li>Dla Google: utwórz projekt w Google Cloud, włącz Calendar API, dodaj OAuth Client ID i wpisz dane klienta w konfiguracji JSON.</li>
          <li>Dodaj osobne konto dla formularza, osobne dla zakupów i osobne dla kalendarza, jeśli chcesz rozdzielić komunikację.</li>
        </ol>
        <pre>{`SMTP:
{"host":"smtp.twojadomena.pl","port":465,"secure":true,"user":"kontakt@domena.pl","password":"haslo-aplikacji"}

Google:
{"clientId":"...","clientSecret":"...","calendarId":"primary"}`}</pre>
      </section>
      <section className="formularzAdmin integracjaForm">
        <label>Typ<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, provider: e.target.value === "GOOGLE" ? "Google Calendar" : "SMTP" })}><option value="EMAIL">E-mail</option><option value="GOOGLE">Google</option></select></label>
        <label>Nazwa<input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label>
        <label>Adres e-mail<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Dostawca<input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></label>
        <label>Konfiguracja JSON<textarea value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} /></label>
        <button className="przycisk" onClick={dodaj}>Dodaj integrację</button>
      </section>
      <section className="listaMini">
        <h2>Podłączone konta</h2>
        {accounts.map((account) => <article key={account.id}><strong>{account.label}</strong><span>{account.type} · {account.provider}</span><small>{account.email}</small><button onClick={() => usun(account.id)}>Usuń</button></article>)}
      </section>
    </div>
  );
}

function CrmPanel({ dane, strony, setStrony, zmienStatus, zmienStatusFormularza, pobierz }) {
  const [podstrona, setPodstrona] = useState("kanban");
  const [pelnyEkran, setPelnyEkran] = useState(true);
  return (
    <div className={`crmWorkspace ${pelnyEkran ? "trybPelny" : ""}`}>
      <div className="pasekKreatora">
        <div><h1>CRM</h1><p>Lejek sprzedaży, klienci, zamówienia i formularze w jednym miejscu.</p></div>
        <div>
          <button onClick={() => setPelnyEkran(!pelnyEkran)}>{pelnyEkran ? "Wróć do panelu" : "Pełny ekran"}</button>
          {["kanban", "klienci", "zamówienia", "formularze"].map((item) => <button className={podstrona === item ? "aktywny" : ""} onClick={() => setPodstrona(item)} key={item}>{item}</button>)}
        </div>
      </div>
      <div className="crmTresc">
        {podstrona === "kanban" && <Kanban orders={dane.orders?.items || []} stages={dane.stages || []} zmienStatus={zmienStatus} pobierz={pobierz} />}
        {podstrona === "klienci" && <ListaZPaginacja dane={dane.users} pola={["email", "name", "role"]} strona={strony.klienci} setStrona={(v) => setStrony({ ...strony, klienci: v })} />}
        {podstrona === "zamówienia" && <ListaZPaginacja dane={dane.orders} pola={["number", "email", "status", "totalCents"]} format={{ totalCents: pieniadze }} strona={strony.zamowienia} setStrona={(v) => setStrony({ ...strony, zamowienia: v })} />}
        {podstrona === "formularze" && <FormularzeAdmin dane={dane.submissions} strona={strony.formularze} setStrona={(v) => setStrony({ ...strony, formularze: v })} zmienStatus={zmienStatusFormularza} />}
      </div>
    </div>
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function akapity(value = "") {
  return value.split("\n\n").filter(Boolean).map((text) => `<p>${escapeHtml(text)}</p>`).join("");
}

function przygotujHtmlStrony(sections, courses) {
  const sekcje = Object.fromEntries(sections.map((s) => [s.key, { ...s, json: JSON.parse(s.data || "{}") }]));
  const start = sekcje["strona-glowna"];
  const omnie = sekcje["o-mnie"];
  const kontakt = sekcje.kontakt;
  const media = start?.json?.media || {};
  return `
    <main class="builder-page">
      <section class="builder-hero">
        <div class="builder-hero-copy">
          <p class="builder-label">Inwestor, Mentor, Przedsiębiorca</p>
          <h1>${escapeHtml(start?.title)}</h1>
          <p>${escapeHtml(start?.content)}</p>
          <a class="builder-button" href="#szkolenia">Zobacz szkolenia</a>
        </div>
        <img src="${escapeHtml(media.miniatura || media.portret || "")}" alt="Kamil Sadziński" />
      </section>
      <section class="builder-about" id="o-mnie">
        <div>
          <p class="builder-label">O mnie i o biznesie</p>
          <h2>${escapeHtml(omnie?.title)}</h2>
          ${akapity(omnie?.content)}
        </div>
        <img src="${escapeHtml(media.portret || "")}" alt="Kamil Sadziński" />
      </section>
      <section class="builder-grid">
        ${[
          ["Czy te szkolenia są dla Ciebie?", "Niezależnie od tego, w jakim punkcie startowym się znajdujesz, przygotowałem ścieżkę, która doprowadzi Cię do celu."],
          ["Kompletna wiedza od A do Z", "Analiza Nieruchomości, Wyszukiwanie Okazji, Flipowanie Krok po Kroku i Mistrzowskie Negocjacje."],
          ["Wszystko czego potrzebujesz w jednym miejscu", "Platforma dostępna 24/7 na każdym urządzeniu. Ucz się we własnym tempie, gdziekolwiek jesteś."]
        ].map(([title, text]) => `<article><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join("")}
      </section>
      <section class="builder-courses" id="szkolenia">
        <div class="builder-section-head">
          <p class="builder-label">sklep</p>
          <h2>Wybierz swoją ścieżkę</h2>
        </div>
        <div class="builder-course-list">
          ${courses.map((course) => `
            <article>
              <img src="${escapeHtml(course.imageUrl || "")}" alt="${escapeHtml(course.title)}" />
              <span>${escapeHtml(course.badge || "")}</span>
              <h3>${escapeHtml(course.title)}</h3>
              <strong>${pieniadze(course.priceCents)}</strong>
              <p>${escapeHtml(course.summary)}</p>
            </article>
          `).join("")}
        </div>
      </section>
      <section class="builder-faq">
        <h2>Najczęściej zadawane pytania</h2>
        <article><h3>Czy ten kurs jest dla początkujących?</h3><p>Tak. Kurs jest zbudowany od zera - pokazuję dokładnie, jak zacząć i przejść cały proces na podstawie mojego doświadczenia.</p></article>
        <article><h3>Czy potrzebuję dużego kapitału na start?</h3><p>Nie. Możesz zacząć bez własnych pieniędzy, np. jako sourcer i zarabiać na wyszukiwaniu okazji dla inwestorów.</p></article>
      </section>
      <footer class="builder-footer" id="kontakt">
        <img src="/logokamil.png" alt="Kamil Sadziński" />
        <div>
          <h2>Zacznij budować swoją przyszłość już dziś</h2>
          <p>Nie czekaj na "idealny moment". Rynek nieruchomości ucieka. Dołącz do grona inwestorów i zrealizuj swój pierwszy zyskowny projekt w tym roku.</p>
        </div>
        <p>${escapeHtml(kontakt?.content)}</p>
      </footer>
    </main>
  `;
}

function domyslnyCssKreatora() {
  return `
    .builder-page{font-family:Inter,Arial,sans-serif;color:#172033;background:#f7f3ec;line-height:1.45}
    .builder-page *{box-sizing:border-box}
    .builder-page section,.builder-footer{position:relative;clear:both;width:100%;padding:72px 56px;overflow:visible}
    .builder-page section + section{margin-top:0}
    .builder-label{margin:0 0 14px;text-transform:uppercase;color:#a95c35;font-weight:900;letter-spacing:.06em}
    .builder-hero,.builder-about{display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:48px;align-items:center}
    .builder-hero h1,.builder-page h2{font-size:58px;line-height:1.02;margin:0 0 22px;color:#0d1321;letter-spacing:0}
    .builder-page h3{font-size:26px;line-height:1.16;margin:0 0 12px;color:#0d1321}
    .builder-page p{font-size:18px;line-height:1.65;margin:0 0 18px}
    .builder-hero img,.builder-about img{display:block;width:100%;height:auto;aspect-ratio:4/5;object-fit:cover}
    .builder-button{display:inline-block;background:#172033;color:#fff;padding:14px 20px;text-decoration:none;font-weight:900}
    .builder-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;align-items:stretch}
    .builder-grid article,.builder-faq article{background:#fffaf1;border:1px solid rgba(23,32,51,.16);padding:26px}
    .builder-section-head{display:block;margin-bottom:28px}
    .builder-course-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;align-items:stretch;width:100%}
    .builder-course-list article{display:grid;grid-template-rows:auto auto auto auto 1fr;align-content:start;min-width:0;background:#fffaf1;border:1px solid rgba(23,32,51,.16);padding:0 26px 26px;overflow:hidden}
    .builder-course-list img{display:block;width:calc(100% + 52px);max-width:none;height:auto;aspect-ratio:4/3;object-fit:cover;margin:0 -26px 20px}
    .builder-course-list span{display:block;color:#a95c35;text-transform:uppercase;font-weight:900;margin-bottom:8px}
    .builder-course-list strong{display:block;color:#a95c35;font-size:30px;line-height:1.1;margin:8px 0 14px}
    .builder-course-list p{margin-bottom:0}
    .builder-faq{padding-top:72px}
    .builder-faq h2{margin-bottom:28px}
    .builder-faq article + article{margin-top:0;border-top:0}
    .builder-footer{display:grid;grid-template-columns:210px minmax(0,1fr) 320px;gap:42px;align-items:start;background:linear-gradient(135deg,#fffaf1,#e6d0aa,#bc8b4c)}
    .builder-footer img{display:block;width:180px;height:auto}
    @media(max-width:900px){.builder-hero,.builder-about,.builder-grid,.builder-course-list,.builder-footer{grid-template-columns:1fr}.builder-page section,.builder-footer{padding:42px 22px}.builder-hero h1,.builder-page h2{font-size:40px}.builder-course-list article{grid-template-rows:auto}.builder-course-list img{aspect-ratio:16/10}}
  `;
}

function KreatorStrony({ sections, courses, pobierz }) {
  const editablePages = [sections.find((s) => s.key === "kreator-strony"), ...sections.filter((s) => s.key?.startsWith("page:"))].filter(Boolean);
  const [selectedId, setSelectedId] = useState(editablePages[0]?.id || "");
  const [newPage, setNewPage] = useState({ title: "", slug: "" });
  const sekcja = editablePages.find((s) => s.id === selectedId) || editablePages[0] || sections[0];
  const edytorRef = useRef(null);
  const [komunikat, setKomunikat] = useState("");
  const [pelnyEkran, setPelnyEkran] = useState(true);

  useEffect(() => {
    if (!sekcja || edytorRef.current) return;
    let aktywny = true;
    async function uruchom() {
      const [{ default: grapesjs }] = await Promise.all([
        import("grapesjs"),
        import("grapesjs/dist/css/grapes.min.css")
      ]);
      if (!aktywny) return;
      const dane = JSON.parse(sekcja.data || "{}");
      const html = sekcja.content || przygotujHtmlStrony(sections, courses);
      const instance = grapesjs.init({
        container: "#kreator-grapes",
        height: "calc(100vh - 88px)",
        fromElement: false,
        storageManager: false,
        canvas: { styles: [] },
        i18n: {
          locale: "pl",
          messages: {
            pl: {
              assetManager: { addButton: "Dodaj obraz", inputPlh: "Wklej adres obrazu", modalTitle: "Wybierz obraz", uploadTitle: "Upuść pliki tutaj lub kliknij, aby wgrać" },
              styleManager: { empty: "Wybierz element, aby edytować style" },
              traitManager: { empty: "Wybierz element, aby edytować ustawienia", label: "Ustawienia" }
            }
          }
        },
        deviceManager: {
          devices: [
            { name: "Komputer", width: "" },
            { name: "Tablet", width: "768px", widthMedia: "992px" },
            { name: "Telefon", width: "390px", widthMedia: "600px" }
          ]
        },
        blockManager: {
          appendTo: "#kreator-bloki",
          blocks: [
            { id: "sekcja", label: "Sekcja", category: "Układ", content: '<section style="padding:60px 40px"><h2>Nowa sekcja</h2><p>Wpisz treść sekcji.</p></section>' },
            { id: "naglowek", label: "Nagłówek", category: "Tekst", content: "<h2>Nagłówek sekcji</h2>" },
            { id: "akapit", label: "Akapit", category: "Tekst", content: "<p>Wpisz treść akapitu.</p>" },
            { id: "przycisk", label: "Przycisk", category: "Elementy", content: '<a class="builder-button" href="#">Przycisk</a>' },
            { id: "obraz", label: "Obraz", category: "Media", content: '<img src="/logokamil.png" alt="Obraz" style="max-width:100%;height:auto" />' },
            { id: "dwie-kolumny", label: "Dwie kolumny", category: "Układ", content: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px"><div><h3>Lewa kolumna</h3><p>Treść.</p></div><div><h3>Prawa kolumna</h3><p>Treść.</p></div></div>' },
            { id: "karta", label: "Karta", category: "Elementy", content: '<article style="padding:26px;background:#fffaf1;border:1px solid rgba(23,32,51,.16)"><h3>Tytuł karty</h3><p>Opis karty.</p></article>' },
            { id: "kurs", label: "Karta kursu", category: "Sklep", content: '<article class="builder-course-card"><img src="/logokamil.png" alt="Kurs" /><span>okazja</span><h3>Nazwa kursu</h3><strong>497 zł</strong><p>Opis kursu.</p></article>' }
          ]
        },
        layerManager: { appendTo: "#kreator-warstwy" },
        styleManager: {
          appendTo: "#kreator-style",
          sectors: [
            { name: "Położenie", open: true, properties: [
              { property: "display", label: "Wyświetlanie" },
              { property: "position", label: "Pozycja" },
              { property: "top", label: "Od góry" },
              { property: "right", label: "Od prawej" },
              { property: "bottom", label: "Od dołu" },
              { property: "left", label: "Od lewej" }
            ] },
            { name: "Rozmiar", open: true, properties: [
              { property: "width", label: "Szerokość" },
              { property: "height", label: "Wysokość" },
              { property: "min-height", label: "Minimalna wysokość" },
              { property: "margin", label: "Margines zewnętrzny" },
              { property: "padding", label: "Margines wewnętrzny" }
            ] },
            { name: "Typografia", open: true, properties: [
              { property: "font-family", label: "Krój pisma" },
              { property: "font-size", label: "Rozmiar tekstu" },
              { property: "font-weight", label: "Grubość tekstu" },
              { property: "line-height", label: "Wysokość linii" },
              { property: "color", label: "Kolor tekstu" },
              { property: "text-align", label: "Wyrównanie" }
            ] },
            { name: "Tło i obramowanie", open: true, properties: [
              { property: "background-color", label: "Kolor tła" },
              { property: "background", label: "Tło" },
              { property: "border", label: "Obramowanie" },
              { property: "box-shadow", label: "Cień" },
              { property: "opacity", label: "Przezroczystość" }
            ] }
          ]
        },
        panels: { defaults: [] }
      });
      instance.setComponents(html);
      instance.setStyle(dane.css || domyslnyCssKreatora());
      edytorRef.current = instance;
    }
    uruchom();
    return () => {
      aktywny = false;
      edytorRef.current?.destroy();
      edytorRef.current = null;
    };
  }, [sekcja?.id]);

  function przelaczStrone(id) {
    const target = editablePages.find((item) => item.id === id);
    const edytor = edytorRef.current;
    setSelectedId(id);
    if (!target || !edytor) return;
    const dane = JSON.parse(target.data || "{}");
    edytor.setComponents(target.content || przygotujHtmlStrony(sections, courses));
    edytor.setStyle(dane.css || domyslnyCssKreatora());
  }

  async function dodajZakladke() {
    if (!newPage.title || !newPage.slug) return;
    const page = await api("/admin/pages", { method: "POST", body: JSON.stringify(newPage) });
    setNewPage({ title: "", slug: "" });
    await pobierz();
    setSelectedId(page.id);
  }

  async function zapisz() {
    const edytor = edytorRef.current;
    if (!edytor || !sekcja) return;
    await api(`/admin/sections/${sekcja.id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...sekcja,
        content: edytor.getHtml(),
        data: JSON.stringify({ ...(JSON.parse(sekcja.data || "{}")), css: edytor.getCss() })
      })
    });
    setKomunikat("Zapisano układ strony.");
    pobierz();
  }

  function urzadzenie(device) {
    const edytor = edytorRef.current;
    if (!edytor) return;
    edytor.setDevice(device);
  }

  function wczytajAktualneTresci() {
    const edytor = edytorRef.current;
    if (!edytor) return;
    edytor.setComponents(przygotujHtmlStrony(sections, courses));
    edytor.setStyle(domyslnyCssKreatora());
    setKomunikat("Wczytano aktualne treści strony do kreatora.");
  }

  return (
    <div className={`kreatorStrony ${pelnyEkran ? "trybPelny" : ""}`}>
      <div className="pasekKreatora">
        <div>
          <h1>Kreator strony</h1>
          <p>Układaj sekcje metodą przeciągnij i upuść, edytuj style i zapisuj gotowy widok na stronie.</p>
        </div>
        <div>
          <button onClick={() => setPelnyEkran(!pelnyEkran)}>{pelnyEkran ? "Wróć do panelu" : "Pełny ekran"}</button>
          <select value={sekcja?.id || ""} onChange={(e) => przelaczStrone(e.target.value)}>
            {editablePages.map((page) => <option value={page.id} key={page.id}>{page.key === "kreator-strony" ? "Strona główna" : page.title}</option>)}
          </select>
          <input placeholder="Nazwa zakładki" value={newPage.title} onChange={(e) => setNewPage({ ...newPage, title: e.target.value })} />
          <input placeholder="slug-url" value={newPage.slug} onChange={(e) => setNewPage({ ...newPage, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
          <button onClick={dodajZakladke}>Dodaj zakładkę</button>
          <button onClick={() => urzadzenie("Komputer")}>Komputer</button>
          <button onClick={() => urzadzenie("Tablet")}>Tablet</button>
          <button onClick={() => urzadzenie("Telefon")}>Telefon</button>
          <button onClick={wczytajAktualneTresci}>Wczytaj aktualne treści</button>
          <button className="zapiszBuilder" onClick={zapisz}>Zapisz stronę</button>
        </div>
      </div>
      {komunikat && <p className="komunikat">{komunikat}</p>}
      <div className="obszarKreatora">
        <aside>
          <h2>Bloki</h2>
          <div id="kreator-bloki" />
          <h2>Warstwy</h2>
          <div id="kreator-warstwy" />
        </aside>
        <div id="kreator-grapes" />
        <aside>
          <h2>Style</h2>
          <div id="kreator-style" />
        </aside>
      </div>
    </div>
  );
}

function Platnosci({ settings, zapisz }) {
  const nazwy = {
    stripe_publishable_key: "Klucz publiczny Stripe",
    stripe_secret_key: "Klucz tajny Stripe",
    stripe_webhook_secret: "Sekret webhooka Stripe"
  };
  const [lokalne, setLokalne] = useState(Object.fromEntries(settings.map((s) => [s.key, s.value === "••••••••" ? "" : s.value])));
  useEffect(() => setLokalne(Object.fromEntries(settings.map((s) => [s.key, s.value === "••••••••" ? "" : s.value]))), [settings]);
  return (
    <div className="platnosci">
      <h1>Integracja płatności</h1>
      <p>BLIK, karty, Apple Pay, Google Pay i PayPal włączysz po stronie konta Stripe. Tu zapisujesz klucze używane przez aplikację i webhook.</p>
      {settings.map((s) => <label key={s.key}>{nazwy[s.key] || s.key}<input value={lokalne[s.key] || ""} placeholder={s.value === "••••••••" ? "Zapisany sekret" : ""} onChange={(e) => setLokalne({ ...lokalne, [s.key]: e.target.value })} /><button onClick={() => zapisz(s.key, lokalne[s.key] || "")}>Zapisz</button></label>)}
    </div>
  );
}

function Kanban({ orders, stages, zmienStatus, pobierz }) {
  const [drag, setDrag] = useState(null);
  const [ustawienia, setUstawienia] = useState(false);
  const [nowyEtap, setNowyEtap] = useState({ name: "", color: "#2f6d50" });
  const sortedStages = (stages.length ? stages : statusy.map(([key, name], index) => ({ key, name, sortOrder: index + 1, color: "#2f6d50" }))).sort((a, b) => a.sortOrder - b.sortOrder);
  async function dodajEtap() {
    await api("/admin/crm-stages", { method: "POST", body: JSON.stringify(nowyEtap) });
    setNowyEtap({ name: "", color: "#2f6d50" });
    pobierz();
  }
  async function aktualizuj(stage, data) {
    await api(`/admin/crm-stages/${stage.id}`, { method: "PUT", body: JSON.stringify(data) });
    pobierz();
  }
  async function usun(stage) {
    await api(`/admin/crm-stages/${stage.id}`, { method: "DELETE" });
    pobierz();
  }
  return (
    <div className="kanbanModul">
      <div className="kanbanTop">
        <h1>CRM sprzedaży</h1>
        <button className="ikonowy" onClick={() => setUstawienia(!ustawienia)}>⚙</button>
      </div>
      {ustawienia && (
        <div className="ustawieniaKanbanu">
          <h2>Ustawienia kolumn</h2>
          {sortedStages.map((stage) => (
            <article key={stage.key}>
              <input value={stage.name} onChange={(e) => aktualizuj(stage, { name: e.target.value })} />
              <input type="color" value={stage.color} onChange={(e) => aktualizuj(stage, { color: e.target.value })} />
              <input type="number" value={stage.sortOrder} onChange={(e) => aktualizuj(stage, { sortOrder: Number(e.target.value) })} />
              <button onClick={() => usun(stage)}>Usuń</button>
            </article>
          ))}
          <article>
            <input placeholder="Nazwa nowej kolumny" value={nowyEtap.name} onChange={(e) => setNowyEtap({ ...nowyEtap, name: e.target.value })} />
            <input type="color" value={nowyEtap.color} onChange={(e) => setNowyEtap({ ...nowyEtap, color: e.target.value })} />
            <button onClick={dodajEtap}>Dodaj kolumnę</button>
          </article>
        </div>
      )}
      <div className="kanban">
        {sortedStages.map((stage) => (
          <section key={stage.key} onDragOver={(e) => e.preventDefault()} onDrop={() => drag && zmienStatus(drag, stage.key)}>
            <h2 style={{ background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)` }}>{stage.name}</h2>
            <div className="kanbanKolumna">
            {orders.filter((o) => o.status === stage.key).map((order) => (
              <article draggable onDragStart={() => setDrag(order.id)} key={order.id}>
                <strong>{order.name}</strong>
                <span>{order.email}</span>
                <b>{pieniadze(order.totalCents)}</b>
              </article>
            ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [widok, setWidok] = useState("start");
  const [dane, setDane] = useState({ sections: [], courses: [] });
  const [wybrany, setWybrany] = useState(null);
  const isPanel = window.location.pathname === "/panel";
  const isKontakt = window.location.pathname === "/kontakt";
  const pages = stronyZKreatora(dane.sections);
  const currentPage = pages.find((page) => `/${page.json.slug}` === window.location.pathname);
  useEffect(() => { if (!isPanel) api("/site").then(setDane); }, [isPanel]);
  useEffect(() => {
    if (!isPanel) api("/track", { method: "POST", body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer || null }) }).catch(() => {});
  }, [isPanel]);
  const pelnyKurs = useMemo(() => dane.courses.find((x) => x.id === wybrany?.id) || wybrany, [dane, wybrany]);
  if (isPanel) return <Panel />;
  return (
    <>
      <Nawigacja pages={pages} />
      {currentPage ? <DynamicPage page={currentPage} /> : isKontakt ? <KontaktPage dane={dane} /> : widok === "kurs" && pelnyKurs ? <Kurs kurs={pelnyKurs} setWidok={setWidok} /> : <Strona dane={dane} setWidok={setWidok} setWybrany={setWybrany} />}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
