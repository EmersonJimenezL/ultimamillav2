const mongoose = require("mongoose");
const { EmpresaReparto } = require("../backend");

function slugifyEmpresa(value) {
  const text = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");

  const stopwords = new Set([
    "sa",
    "s",
    "a",
    "ltda",
    "spa",
    "limitada",
    "ltd",
    "srl",
    "eirl",
    "inc",
    "corp",
    "cia",
    "compania",
    "y",
    "de",
    "del",
    "la",
    "el",
    "los",
    "las",
  ]);

  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .filter((w) => !stopwords.has(w))
    .join("");
}

async function main() {
  const force = process.argv.includes("--force");
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/ultimamillav2";
  await mongoose.connect(uri);

  const empresas = await EmpresaReparto.find().sort({ createdAt: 1 });
  const used = force
    ? new Set()
    : new Set(
        empresas
          .map((e) => (e.slug ? String(e.slug).toLowerCase() : null))
          .filter(Boolean)
      );

  let updated = 0;

  for (const empresa of empresas) {
    if (!force && empresa.slug && String(empresa.slug).trim() !== "") continue;

    const base = slugifyEmpresa(empresa.razonSocial);
    if (!base) continue;

    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }

    empresa.slug = candidate;
    used.add(candidate);
    await empresa.save();
    updated += 1;
    console.log(`OK: ${empresa.razonSocial} -> ${empresa.slug}`);
  }

  console.log(`\nListo. Empresas actualizadas: ${updated}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exitCode = 1;
});
