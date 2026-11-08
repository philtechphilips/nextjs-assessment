import { COMPANY_STATUSES, type Company } from "@/lib/api/schema";

const NAMES = [
  "Aalders Logistiek",
  "Amstel Analytics",
  "Bakker & Zonen",
  "Betuwe Fruit",
  "Blauwe Haven Software",
  "Brabant Bouw",
  "Canal Street Media",
  "Dijkstra Consultancy",
  "Dordt Dynamics",
  "Eemland Energie",
  "Flevo Farms",
  "Friesland Foods Trading",
  "Gouda Print",
  "Groningen Robotics",
  "Haarlem Health",
  "Hanze Security",
  "IJssel Marine",
  "Jansen Installatietechniek",
  "Kempen Kitchens",
  "Kuiper Legal",
  "Leiden Biotech",
  "Limburg Solar",
  "Maas Freight",
  "Meijer Retail Group",
  "Noord Data",
  "Oranje Payments",
  "Peters Packaging",
  "Polder Water Systems",
  "Randstad Cloud",
  "Rotterdam Port Services",
  "Scheveningen Surf Co",
  "Smit Engineering",
  "Texel Travel",
  "Tilburg Textiles",
  "Utrecht Uitgevers",
  "Van Dam Accountants",
  "Veluwe Ventures",
  "De Vries Automotive",
  "Waddenzee Wind",
  "Zeeland Seafood",
];

const DAY_MS = 86_400_000;
const NEWEST_SEED_DATE = Date.UTC(2026, 9, 30, 9, 0, 0);

function toDomain(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, "")}.example`;
}

export function seedCompanies(): Company[] {
  return NAMES.map((name, index) => {
    const timestamp = new Date(NEWEST_SEED_DATE - index * DAY_MS).toISOString();
    return {
      id: `company-${String(index + 1).padStart(2, "0")}`,
      name,
      // Every seventh company has no domain, so the empty case is visible.
      domain: index % 7 === 6 ? null : toDomain(name),
      status: COMPANY_STATUSES[index % COMPANY_STATUSES.length],
      version: 1,
      created_at: timestamp,
      updated_at: timestamp,
    };
  });
}
