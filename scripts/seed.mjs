/**
 * Idempotent seed for TracePlate.
 * MERGE on id so re-runs do not duplicate the graph.
 *
 * Indian food-supply stories: palak, paneer, prawns, chicken.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const URI = process.env.COGNODB_URI;
const USER = process.env.COGNODB_USERNAME || "cognodb";
const PASSWORD = process.env.COGNODB_PASSWORD;

if (!URI || !PASSWORD) {
  console.error("Missing COGNODB_URI or COGNODB_PASSWORD. Copy .env.example to .env.local.");
  process.exit(1);
}

const cities = [
  { id: "city-sf", name: "Mumbai", state: "MH" },
  { id: "city-sea", name: "Bengaluru", state: "KA" },
  { id: "city-pdx", name: "Hyderabad", state: "TS" },
  { id: "city-chi", name: "Delhi", state: "DL" },
  { id: "city-nyc", name: "Kolkata", state: "WB" },
  { id: "city-bos", name: "Chennai", state: "TN" },
  { id: "city-aus", name: "Pune", state: "MH" },
  { id: "city-nola", name: "Kochi", state: "KL" },
];

const ingredients = [
  { id: "ing-spinach", name: "Palak", category: "leafy green", perishable: true },
  { id: "ing-lettuce", name: "Methi", category: "leafy green", perishable: true },
  { id: "ing-kale", name: "Sarson", category: "leafy green", perishable: true },
  { id: "ing-arugula", name: "Dhania", category: "herb", perishable: true },
  { id: "ing-tomato", name: "Tamatar", category: "produce", perishable: true },
  { id: "ing-basil", name: "Pudina", category: "herb", perishable: true },
  { id: "ing-avocado", name: "Nariyal", category: "produce", perishable: true },
  { id: "ing-lemon", name: "Nimbu", category: "citrus", perishable: true },
  { id: "ing-strawberry", name: "Aam", category: "fruit", perishable: true },
  { id: "ing-ricotta", name: "Paneer", category: "dairy", perishable: true },
  { id: "ing-brie", name: "Fresh paneer", category: "dairy", perishable: true },
  { id: "ing-butter", name: "Ghee", category: "dairy", perishable: true },
  { id: "ing-cream", name: "Malai", category: "dairy", perishable: true },
  { id: "ing-oyster", name: "Prawns", category: "seafood", perishable: true },
  { id: "ing-shrimp", name: "Tiger prawns", category: "seafood", perishable: true },
  { id: "ing-crab", name: "Crab", category: "seafood", perishable: true },
  { id: "ing-salmon", name: "Pomfret", category: "seafood", perishable: true },
  { id: "ing-chicken", name: "Chicken", category: "poultry", perishable: true },
  { id: "ing-egg", name: "Anda", category: "poultry", perishable: true },
  { id: "ing-beef", name: "Mutton", category: "meat", perishable: true },
  { id: "ing-pork", name: "Keema", category: "meat", perishable: true },
  { id: "ing-flour", name: "Atta", category: "dry good", perishable: false },
  { id: "ing-olive", name: "Mustard oil", category: "pantry", perishable: false },
  { id: "ing-mushroom", name: "Mushroom", category: "produce", perishable: true },
  { id: "ing-potato", name: "Aloo", category: "produce", perishable: false },
  { id: "ing-onion", name: "Pyaaz", category: "produce", perishable: false },
  { id: "ing-garlic", name: "Lehsun", category: "produce", perishable: false },
  { id: "ing-apple", name: "Mango pickle", category: "pantry", perishable: false },
  { id: "ing-oat", name: "Rice", category: "dry good", perishable: false },
  { id: "ing-honey", name: "Gur", category: "pantry", perishable: false },
];

const farms = [
  { id: "farm-greenvalley", name: "Doaba Palak Farms", city: "Jalandhar", state: "PB", region: "Punjab", produceType: "palak & greens", certification: "FSSAI" },
  { id: "farm-fogline", name: "Nashik Green Belt", city: "Nashik", state: "MH", region: "Maharashtra", produceType: "greens & mango", certification: "FSSAI" },
  { id: "farm-delta", name: "Yamuna Khet", city: "Panipat", state: "HR", region: "Haryana", produceType: "palak & tamatar", certification: "FSSAI" },
  { id: "farm-willamette", name: "Coorg Hills Produce", city: "Madikeri", state: "KA", region: "Kodagu", produceType: "produce", certification: "FSSAI" },
  { id: "farm-skagit", name: "Mysore Mandi Farms", city: "Mysuru", state: "KA", region: "Mysuru", produceType: "produce", certification: "FSSAI" },
  { id: "farm-meadowbrook", name: "Anand Milk Union", city: "Anand", state: "GJ", region: "Gujarat", produceType: "dairy", certification: "FSSAI" },
  { id: "farm-prairie", name: "Karnal Dairy Belt", city: "Karnal", state: "HR", region: "Haryana", produceType: "dairy", certification: "FSSAI" },
  { id: "farm-gulfshore", name: "Alleppey Prawn Farms", city: "Alappuzha", state: "KL", region: "Kerala backwaters", produceType: "prawns", certification: "FSSAI" },
  { id: "farm-bayou", name: "Kakinada Catch", city: "Kakinada", state: "AP", region: "Andhra coast", produceType: "prawns", certification: "FSSAI" },
  { id: "farm-hudson", name: "Ratnagiri Alphonso Groves", city: "Ratnagiri", state: "MH", region: "Konkan", produceType: "mango", certification: "FSSAI" },
  { id: "farm-champlain", name: "Palakkad Dairy", city: "Palakkad", state: "KL", region: "Kerala", produceType: "dairy", certification: "FSSAI" },
  { id: "farm-hilltop", name: "Namakkal Poultry", city: "Namakkal", state: "TN", region: "Tamil Nadu", produceType: "chicken", certification: "FSSAI" },
  { id: "farm-llano", name: "Hyderabad Mutton Yards", city: "Hyderabad", state: "TS", region: "Deccan", produceType: "mutton", certification: "FSSAI" },
  { id: "farm-pecan", name: "Warangal Produce", city: "Warangal", state: "TS", region: "Telangana", produceType: "produce", certification: "FSSAI" },
  { id: "farm-sonoma", name: "Pune Poultry Belt", city: "Pune", state: "MH", region: "Maharashtra", produceType: "chicken", certification: "FSSAI" },
  { id: "farm-olympic", name: "Mangalore Fish Landing", city: "Mangaluru", state: "KA", region: "Karnataka coast", produceType: "fish", certification: "FSSAI" },
  { id: "farm-driftless", name: "Rajasthan Sheep & Grain", city: "Bikaner", state: "RJ", region: "Rajasthan", produceType: "mutton & atta", certification: "FSSAI" },
  { id: "farm-cape", name: "Tuticorin Catch", city: "Thoothukudi", state: "TN", region: "Tamil Nadu coast", produceType: "seafood", certification: "FSSAI" },
];

const processors = [
  { id: "proc-pacific", name: "Punjab Fresh Cut", city: "Ludhiana", state: "PB", kind: "fresh-cut" },
  { id: "proc-goldengate", name: "Delhi Pack & Cool", city: "Delhi", state: "DL", kind: "fresh-cut" },
  { id: "proc-cascadia", name: "Bengaluru Packers", city: "Bengaluru", state: "KA", kind: "fresh-cut" },
  { id: "proc-northlake", name: "Anand Paneer Works", city: "Anand", state: "GJ", kind: "dairy" },
  { id: "proc-lakeshore", name: "Karnal Dairy Works", city: "Karnal", state: "HR", kind: "dairy" },
  { id: "proc-deltaice", name: "Kochi Ice & Catch", city: "Kochi", state: "KL", kind: "seafood" },
  { id: "proc-gulfcan", name: "Vizag Seafood Pack", city: "Visakhapatnam", state: "AP", kind: "seafood" },
  { id: "proc-hudsonmill", name: "Ratnagiri Pack", city: "Ratnagiri", state: "MH", kind: "produce" },
  { id: "proc-eastside", name: "Namakkal Poultry Pack", city: "Namakkal", state: "TN", kind: "poultry" },
  { id: "proc-hillcountry", name: "Hyderabad Meat Pack", city: "Hyderabad", state: "TS", kind: "meat" },
  { id: "proc-willamette", name: "Mysore Cold Cut", city: "Mysuru", state: "KA", kind: "fresh-cut" },
  { id: "proc-northend", name: "Chennai Fish Ice", city: "Chennai", state: "TN", kind: "seafood" },
];

const distributors = [
  { id: "dist-westcoast", name: "West India Fresh", region: "West", hub: "Mumbai" },
  { id: "dist-cascadia", name: "South Route Foods", region: "South", hub: "Bengaluru" },
  { id: "dist-heartland", name: "North Belt Produce", region: "North", hub: "Delhi" },
  { id: "dist-southern", name: "Kerala–TN Route", region: "South coast", hub: "Kochi" },
  { id: "dist-atlantic", name: "East Coast Grocers", region: "East", hub: "Chennai" },
  { id: "dist-metro", name: "Kolkata Night Haul", region: "East", hub: "Kolkata" },
  { id: "dist-sunbelt", name: "Deccan Supply", region: "Deccan", hub: "Pune" },
  { id: "dist-baycity", name: "Mumbai Provisions", region: "Mumbai", hub: "Bhiwandi" },
];

const restaurants = [
  { id: "rst-fennel", name: "Cafe Madras", city: "Mumbai", state: "MH", cuisine: "South Indian", neighborhood: "Matunga", cityId: "city-sf" },
  { id: "rst-harbor", name: "Trishna", city: "Mumbai", state: "MH", cuisine: "seafood", neighborhood: "Fort", cityId: "city-sf" },
  { id: "rst-mission", name: "The Bombay Canteen", city: "Mumbai", state: "MH", cuisine: "Indian", neighborhood: "Lower Parel", cityId: "city-sf" },
  { id: "rst-nobhill", name: "Britannia & Co.", city: "Mumbai", state: "MH", cuisine: "Parsi", neighborhood: "Ballard Estate", cityId: "city-sf" },
  { id: "rst-pike", name: "MTR", city: "Bengaluru", state: "KA", cuisine: "South Indian", neighborhood: "Lalbagh", cityId: "city-sea" },
  { id: "rst-ballard", name: "Vidyarthi Bhavan", city: "Bengaluru", state: "KA", cuisine: "vegetarian", neighborhood: "Basavanagudi", cityId: "city-sea" },
  { id: "rst-fremont", name: "Karavalli", city: "Bengaluru", state: "KA", cuisine: "coastal", neighborhood: "MG Road", cityId: "city-sea" },
  { id: "rst-alberta", name: "Paradise Biryani", city: "Hyderabad", state: "TS", cuisine: "Hyderabadi", neighborhood: "Secunderabad", cityId: "city-pdx" },
  { id: "rst-division", name: "Bawarchi", city: "Hyderabad", state: "TS", cuisine: "Hyderabadi", neighborhood: "RTC X Roads", cityId: "city-pdx" },
  { id: "rst-logan", name: "Karim's", city: "Delhi", state: "DL", cuisine: "Mughlai", neighborhood: "Jama Masjid", cityId: "city-chi" },
  { id: "rst-westloop", name: "Indian Accent", city: "Delhi", state: "DL", cuisine: "Indian", neighborhood: "Lodhi Road", cityId: "city-chi" },
  { id: "rst-pilsen", name: "Saravana Bhavan", city: "Delhi", state: "DL", cuisine: "South Indian", neighborhood: "Janpath", cityId: "city-chi" },
  { id: "rst-wicker", name: "Haldiram's", city: "Delhi", state: "DL", cuisine: "North Indian", neighborhood: "Connaught Place", cityId: "city-chi" },
  { id: "rst-redhook", name: "Peter Cat", city: "Kolkata", state: "WB", cuisine: "Bengali", neighborhood: "Park Street", cityId: "city-nyc" },
  { id: "rst-eastvillage", name: "Oh! Calcutta", city: "Kolkata", state: "WB", cuisine: "Bengali", neighborhood: "Forum", cityId: "city-nyc" },
  { id: "rst-chelsea", name: "6 Ballygunge Place", city: "Kolkata", state: "WB", cuisine: "Bengali", neighborhood: "Ballygunge", cityId: "city-nyc" },
  { id: "rst-harlem", name: "Arsalan", city: "Kolkata", state: "WB", cuisine: "Mughlai", neighborhood: "Park Circus", cityId: "city-nyc" },
  { id: "rst-northend", name: "Murugan Idli Shop", city: "Chennai", state: "TN", cuisine: "South Indian", neighborhood: "T. Nagar", cityId: "city-bos" },
  { id: "rst-cambridge", name: "Ratna Cafe", city: "Chennai", state: "TN", cuisine: "South Indian", neighborhood: "Triplicane", cityId: "city-bos" },
  { id: "rst-eastaustin", name: "Vaishali", city: "Pune", state: "MH", cuisine: "Maharashtrian", neighborhood: "FC Road", cityId: "city-aus" },
  { id: "rst-southcong", name: "Malaka Spice", city: "Pune", state: "MH", cuisine: "coastal", neighborhood: "Koregaon Park", cityId: "city-aus" },
  { id: "rst-domain", name: "Shabree", city: "Pune", state: "MH", cuisine: "Maharashtrian", neighborhood: "Deccan", cityId: "city-aus" },
  { id: "rst-marigny", name: "Kayees Rahmathulla", city: "Kochi", state: "KL", cuisine: "Kerala", neighborhood: "Mattancherry", cityId: "city-nola" },
  { id: "rst-garden", name: "Fort Kochi Fish Fry", city: "Kochi", state: "KL", cuisine: "Kerala", neighborhood: "Fort Kochi", cityId: "city-nola" },
  { id: "rst-bywater", name: "Paragon", city: "Kochi", state: "KL", cuisine: "Kerala", neighborhood: "Edappally", cityId: "city-nola" },
];

const dishes = [
  { id: "dish-spinach-salad", name: "Palak paneer", course: "main", ingredients: ["ing-spinach", "ing-ricotta", "ing-cream"], kitchens: ["rst-fennel", "rst-mission", "rst-ballard", "rst-chelsea", "rst-cambridge", "rst-domain"] },
  { id: "dish-cobb", name: "Chicken biryani", course: "main", ingredients: ["ing-chicken", "ing-onion", "ing-oat", "ing-egg"], kitchens: ["rst-nobhill", "rst-fremont", "rst-harlem", "rst-alberta"] },
  { id: "dish-kale-caesar", name: "Sarson da saag", course: "main", ingredients: ["ing-kale", "ing-butter", "ing-onion"], kitchens: ["rst-fennel", "rst-alberta", "rst-westloop"] },
  { id: "dish-arugula-pizza", name: "Paneer kulcha", course: "main", ingredients: ["ing-arugula", "ing-ricotta", "ing-flour", "ing-olive"], kitchens: ["rst-logan", "rst-eastvillage"] },
  { id: "dish-oyster-plate", name: "Prawn fry", course: "starter", ingredients: ["ing-oyster", "ing-lemon"], kitchens: ["rst-harbor", "rst-division", "rst-redhook", "rst-southcong", "rst-marigny", "rst-northend"] },
  { id: "dish-shrimp-etouffee", name: "Prawn curry", course: "main", ingredients: ["ing-shrimp", "ing-onion", "ing-garlic", "ing-avocado"], kitchens: ["rst-marigny", "rst-garden", "rst-bywater"] },
  { id: "dish-crab-toast", name: "Crab masala", course: "starter", ingredients: ["ing-crab", "ing-butter", "ing-lemon"], kitchens: ["rst-harbor", "rst-garden", "rst-redhook"] },
  { id: "dish-salmon", name: "Pomfret fry", course: "main", ingredients: ["ing-salmon", "ing-lemon", "ing-olive"], kitchens: ["rst-pike", "rst-fremont", "rst-alberta"] },
  { id: "dish-ricotta-gnocchi", name: "Paneer butter masala", course: "main", ingredients: ["ing-ricotta", "ing-butter", "ing-cream", "ing-tomato"], kitchens: ["rst-logan", "rst-eastvillage", "rst-westloop"] },
  { id: "dish-cheese-board", name: "Paneer tikka", course: "starter", ingredients: ["ing-brie", "ing-basil", "ing-lemon"], kitchens: ["rst-wicker", "rst-westloop", "rst-nobhill", "rst-chelsea"] },
  { id: "dish-strawberry-fool", name: "Aamras", course: "dessert", ingredients: ["ing-strawberry", "ing-cream", "ing-honey"], kitchens: ["rst-wicker", "rst-fennel", "rst-cambridge"] },
  { id: "dish-roast-chicken", name: "Butter chicken", course: "main", ingredients: ["ing-chicken", "ing-butter", "ing-cream", "ing-tomato"], kitchens: ["rst-nobhill", "rst-harlem", "rst-eastaustin"] },
  { id: "dish-brisket", name: "Mutton curry", course: "main", ingredients: ["ing-beef", "ing-onion"], kitchens: ["rst-eastaustin", "rst-logan"] },
  { id: "dish-pork-chop", name: "Keema pav", course: "main", ingredients: ["ing-pork", "ing-onion", "ing-garlic"], kitchens: ["rst-westloop", "rst-alberta"] },
  { id: "dish-mushroom-toast", name: "Mushroom masala", course: "starter", ingredients: ["ing-mushroom", "ing-butter", "ing-garlic"], kitchens: ["rst-mission", "rst-ballard", "rst-domain"] },
  { id: "dish-tomato-salad", name: "Kachumber", course: "starter", ingredients: ["ing-tomato", "ing-basil", "ing-onion"], kitchens: ["rst-pilsen", "rst-domain", "rst-mission"] },
  { id: "dish-avocado-toast", name: "Egg bhurji", course: "starter", ingredients: ["ing-egg", "ing-onion", "ing-tomato"], kitchens: ["rst-ballard", "rst-chelsea", "rst-cambridge"] },
  { id: "dish-clam-chowder", name: "Meen moilee", course: "main", ingredients: ["ing-cream", "ing-avocado", "ing-onion"], kitchens: ["rst-northend", "rst-pike"] },
];

const farmGrows = {
  "farm-greenvalley": ["ing-spinach", "ing-lettuce", "ing-kale", "ing-arugula"],
  "farm-fogline": ["ing-strawberry", "ing-lettuce", "ing-basil"],
  "farm-delta": ["ing-spinach", "ing-tomato", "ing-onion"],
  "farm-willamette": ["ing-kale", "ing-potato", "ing-apple", "ing-mushroom"],
  "farm-skagit": ["ing-potato", "ing-onion", "ing-garlic", "ing-apple"],
  "farm-meadowbrook": ["ing-ricotta", "ing-brie", "ing-butter", "ing-cream"],
  "farm-prairie": ["ing-butter", "ing-cream"],
  "farm-gulfshore": ["ing-oyster", "ing-crab"],
  "farm-bayou": ["ing-shrimp"],
  "farm-hudson": ["ing-apple", "ing-honey"],
  "farm-champlain": ["ing-butter", "ing-cream"],
  "farm-hilltop": ["ing-chicken", "ing-egg"],
  "farm-llano": ["ing-beef", "ing-onion"],
  "farm-pecan": ["ing-tomato", "ing-basil", "ing-onion"],
  "farm-sonoma": ["ing-chicken", "ing-egg"],
  "farm-olympic": ["ing-salmon"],
  "farm-driftless": ["ing-pork", "ing-flour", "ing-oat"],
  "farm-cape": ["ing-crab"],
};

const farmSupplies = {
  "farm-greenvalley": ["proc-pacific"],
  "farm-fogline": ["proc-pacific", "proc-goldengate"],
  "farm-delta": ["proc-goldengate"],
  "farm-willamette": ["proc-willamette", "proc-cascadia"],
  "farm-skagit": ["proc-cascadia"],
  "farm-meadowbrook": ["proc-northlake"],
  "farm-prairie": ["proc-northlake", "proc-lakeshore"],
  "farm-gulfshore": ["proc-deltaice"],
  "farm-bayou": ["proc-deltaice", "proc-gulfcan"],
  "farm-hudson": ["proc-hudsonmill"],
  "farm-champlain": ["proc-lakeshore", "proc-hudsonmill"],
  "farm-hilltop": ["proc-eastside"],
  "farm-llano": ["proc-hillcountry"],
  "farm-pecan": ["proc-hillcountry"],
  "farm-sonoma": ["proc-goldengate"],
  "farm-olympic": ["proc-cascadia"],
  "farm-driftless": ["proc-northlake"],
  "farm-cape": ["proc-northend"],
};

const processorPacks = {
  "proc-pacific": ["ing-spinach", "ing-lettuce", "ing-kale", "ing-arugula", "ing-strawberry"],
  "proc-goldengate": ["ing-lettuce", "ing-tomato", "ing-basil", "ing-chicken"],
  "proc-cascadia": ["ing-kale", "ing-potato", "ing-salmon", "ing-apple"],
  "proc-northlake": ["ing-ricotta", "ing-brie", "ing-butter", "ing-cream", "ing-pork"],
  "proc-lakeshore": ["ing-butter", "ing-cream"],
  "proc-deltaice": ["ing-oyster", "ing-shrimp", "ing-crab"],
  "proc-gulfcan": ["ing-shrimp"],
  "proc-hudsonmill": ["ing-apple", "ing-honey", "ing-butter"],
  "proc-eastside": ["ing-chicken", "ing-egg"],
  "proc-hillcountry": ["ing-beef", "ing-tomato", "ing-onion"],
  "proc-willamette": ["ing-kale", "ing-mushroom", "ing-potato"],
  "proc-northend": ["ing-crab"],
};

const processorShips = {
  "proc-pacific": ["dist-westcoast", "dist-baycity", "dist-heartland"],
  "proc-goldengate": ["dist-westcoast", "dist-baycity"],
  "proc-cascadia": ["dist-cascadia"],
  "proc-northlake": ["dist-heartland", "dist-metro"],
  "proc-lakeshore": ["dist-heartland", "dist-atlantic"],
  "proc-deltaice": ["dist-southern", "dist-metro", "dist-sunbelt"],
  "proc-gulfcan": ["dist-southern", "dist-sunbelt"],
  "proc-hudsonmill": ["dist-atlantic", "dist-metro"],
  "proc-eastside": ["dist-atlantic", "dist-metro"],
  "proc-hillcountry": ["dist-sunbelt", "dist-southern"],
  "proc-willamette": ["dist-cascadia", "dist-westcoast"],
  "proc-northend": ["dist-atlantic"],
};

const distDelivers = {
  "dist-westcoast": ["rst-fennel", "rst-harbor", "rst-mission", "rst-nobhill", "rst-alberta"],
  "dist-cascadia": ["rst-pike", "rst-ballard", "rst-fremont", "rst-alberta", "rst-division"],
  "dist-heartland": ["rst-logan", "rst-westloop", "rst-pilsen", "rst-wicker", "rst-chelsea"],
  "dist-southern": ["rst-marigny", "rst-garden", "rst-bywater", "rst-southcong", "rst-eastaustin"],
  "dist-atlantic": ["rst-eastvillage", "rst-harlem", "rst-northend", "rst-cambridge"],
  "dist-metro": ["rst-redhook", "rst-eastvillage", "rst-chelsea", "rst-harlem"],
  "dist-sunbelt": ["rst-eastaustin", "rst-southcong", "rst-domain"],
  "dist-baycity": ["rst-fennel", "rst-harbor", "rst-mission", "rst-nobhill"],
};

const recalls = [
  {
    id: "recall-spinach",
    title: "Palak — E. coli",
    contaminant: "E. coli",
    severity: "outbreak",
    date: "2026-03-12",
    status: "active",
    summary:
      "Palak from Doaba Palak Farms in Jalandhar tested positive. Punjab Fresh Cut packed it the same night and trucks left for Mumbai and Delhi.",
    flags: ["farm-greenvalley"],
  },
  {
    id: "recall-cheese",
    title: "Paneer — Listeria",
    contaminant: "Listeria",
    severity: "advisory",
    date: "2026-02-28",
    status: "active",
    summary:
      "Listeria was found on a draining table at Anand Paneer Works. Fresh paneer from that week went to restaurants in Delhi and Kolkata.",
    flags: ["proc-northlake"],
  },
  {
    id: "recall-oyster",
    title: "Prawns — Vibrio",
    contaminant: "Vibrio",
    severity: "outbreak",
    date: "2026-04-02",
    status: "active",
    summary:
      "Prawns from Alleppey Prawn Farms sat too long without ice at Kochi Ice & Catch. They reached Kochi, Pune and Kolkata kitchens.",
    flags: ["farm-gulfshore"],
  },
  {
    id: "recall-poultry",
    title: "Chicken — Salmonella",
    contaminant: "Salmonella",
    severity: "watch",
    date: "2026-01-19",
    status: "contained",
    summary:
      "A Namakkal flock was packed at Namakkal Poultry Pack. Most of it was stopped. A few Chennai and Kolkata restaurants still received it.",
    flags: ["farm-hilltop"],
  },
];

async function run(driver) {
  const clear = `
    MATCH (n)
    DETACH DELETE n
  `;

  const mergeCities = `
    UNWIND $rows AS row
    MERGE (c:City {id: row.id})
    SET c.name = row.name, c.state = row.state
  `;
  const mergeIngredients = `
    UNWIND $rows AS row
    MERGE (i:Ingredient {id: row.id})
    SET i.name = row.name, i.category = row.category, i.perishable = row.perishable
  `;
  const mergeFarms = `
    UNWIND $rows AS row
    MERGE (f:Farm {id: row.id})
    SET f.name = row.name, f.city = row.city, f.state = row.state,
        f.region = row.region, f.produceType = row.produceType, f.certification = row.certification
  `;
  const mergeProcessors = `
    UNWIND $rows AS row
    MERGE (p:Processor {id: row.id})
    SET p.name = row.name, p.city = row.city, p.state = row.state, p.kind = row.kind, p.region = row.city
  `;
  const mergeDistributors = `
    UNWIND $rows AS row
    MERGE (d:Distributor {id: row.id})
    SET d.name = row.name, d.region = row.region, d.hub = row.hub, d.city = row.hub
  `;
  const mergeRestaurants = `
    UNWIND $rows AS row
    MERGE (r:Restaurant {id: row.id})
    SET r.name = row.name, r.city = row.city, r.state = row.state,
        r.cuisine = row.cuisine, r.neighborhood = row.neighborhood
    WITH r, row
    MATCH (c:City {id: row.cityId})
    MERGE (r)-[:LOCATED_IN]->(c)
  `;
  const mergeDishes = `
    UNWIND $rows AS row
    MERGE (d:Dish {id: row.id})
    SET d.name = row.name, d.course = row.course
  `;
  const mergeRecalls = `
    UNWIND $rows AS row
    MERGE (r:Recall {id: row.id})
    SET r.title = row.title, r.contaminant = row.contaminant, r.severity = row.severity,
        r.date = row.date, r.status = row.status, r.name = row.title, r.summary = row.summary
  `;

  const grows = `
    UNWIND $rows AS row
    MATCH (f:Farm {id: row.farmId})
    MATCH (i:Ingredient {id: row.ingredientId})
    MERGE (f)-[:GROWS]->(i)
  `;
  const supplies = `
    UNWIND $rows AS row
    MATCH (f:Farm {id: row.farmId})
    MATCH (p:Processor {id: row.processorId})
    MERGE (f)-[:SUPPLIES]->(p)
  `;
  const packs = `
    UNWIND $rows AS row
    MATCH (p:Processor {id: row.processorId})
    MATCH (i:Ingredient {id: row.ingredientId})
    MERGE (p)-[:PACKS]->(i)
  `;
  const ships = `
    UNWIND $rows AS row
    MATCH (p:Processor {id: row.processorId})
    MATCH (d:Distributor {id: row.distributorId})
    MERGE (p)-[:SHIPS_TO]->(d)
  `;
  const delivers = `
    UNWIND $rows AS row
    MATCH (d:Distributor {id: row.distributorId})
    MATCH (r:Restaurant {id: row.restaurantId})
    MERGE (d)-[:DELIVERS_TO]->(r)
  `;
  const serves = `
    UNWIND $rows AS row
    MATCH (r:Restaurant {id: row.restaurantId})
    MATCH (d:Dish {id: row.dishId})
    MERGE (r)-[:SERVES]->(d)
  `;
  const contains = `
    UNWIND $rows AS row
    MATCH (d:Dish {id: row.dishId})
    MATCH (i:Ingredient {id: row.ingredientId})
    MERGE (d)-[:CONTAINS]->(i)
  `;
  const flags = `
    UNWIND $rows AS row
    MATCH (r:Recall {id: row.recallId})
    MATCH (n {id: row.targetId})
    MERGE (r)-[:FLAGS]->(n)
  `;

  const pairs = (map, fromKey, toKey) =>
    Object.entries(map).flatMap(([from, tos]) =>
      tos.map((to) => ({ [fromKey]: from, [toKey]: to })),
    );

  const serveRows = dishes.flatMap((d) =>
    d.kitchens.map((restaurantId) => ({ restaurantId, dishId: d.id })),
  );
  const containRows = dishes.flatMap((d) =>
    d.ingredients.map((ingredientId) => ({ dishId: d.id, ingredientId })),
  );
  const flagRows = recalls.flatMap((r) =>
    r.flags.map((targetId) => ({ recallId: r.id, targetId })),
  );

  console.log("Connecting to CognoDB…");
  const info = await driver.getServerInfo();
  console.log("Connected:", info.address);

  console.log("Clearing previous graph…");
  await driver.executeQuery(clear);

  console.log("Writing nodes…");
  await driver.executeQuery(mergeCities, { rows: cities });
  await driver.executeQuery(mergeIngredients, { rows: ingredients });
  await driver.executeQuery(mergeFarms, { rows: farms });
  await driver.executeQuery(mergeProcessors, { rows: processors });
  await driver.executeQuery(mergeDistributors, { rows: distributors });
  await driver.executeQuery(mergeRestaurants, { rows: restaurants });
  await driver.executeQuery(mergeDishes, {
    rows: dishes.map(({ id, name, course }) => ({ id, name, course })),
  });
  await driver.executeQuery(mergeRecalls, { rows: recalls });

  console.log("Writing relationships…");
  await driver.executeQuery(grows, {
    rows: pairs(farmGrows, "farmId", "ingredientId"),
  });
  await driver.executeQuery(supplies, {
    rows: pairs(farmSupplies, "farmId", "processorId"),
  });
  await driver.executeQuery(packs, {
    rows: pairs(processorPacks, "processorId", "ingredientId"),
  });
  await driver.executeQuery(ships, {
    rows: pairs(processorShips, "processorId", "distributorId"),
  });
  await driver.executeQuery(delivers, {
    rows: pairs(distDelivers, "distributorId", "restaurantId"),
  });
  await driver.executeQuery(serves, { rows: serveRows });
  await driver.executeQuery(contains, { rows: containRows });
  await driver.executeQuery(flags, { rows: flagRows });

  const [{ records: nodeRecs }, { records: relRecs }] = await Promise.all([
    driver.executeQuery("MATCH (n) RETURN count(n) AS nodes"),
    driver.executeQuery("MATCH ()-[r]->() RETURN count(r) AS rels"),
  ]);

  const nodes = nodeRecs[0].get("nodes").toNumber();
  const rels = relRecs[0].get("rels").toNumber();
  console.log(`Seed complete: ${nodes} nodes, ${rels} relationships.`);
}

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD), {
  maxConnectionPoolSize: 4,
  connectionTimeout: 12_000,
});

run(driver)
  .catch((err) => {
    console.error("Seed failed:", err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await driver.close();
  });
