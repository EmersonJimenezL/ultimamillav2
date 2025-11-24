// Script para agregar numeroRuta a las rutas existentes
const mongoose = require("mongoose");
const { Ruta } = require("./backend");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/ultimamillav2";

async function migrateRutas() {
  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    const rutas = await Ruta.find({ numeroRuta: { $exists: false } });
    console.log(`\n📦 Encontradas ${rutas.length} rutas sin numeroRuta`);

    if (rutas.length === 0) {
      console.log("✅ No hay rutas que migrar");
      process.exit(0);
    }

    for (let i = 0; i < rutas.length; i++) {
      const ruta = rutas[i];
      const fecha = new Date(ruta.createdAt);
      const year = fecha.getFullYear().toString().slice(-2);
      const month = String(fecha.getMonth() + 1).padStart(2, "0");
      const sequential = String(i + 1).padStart(4, "0");
      ruta.numeroRuta = `R${year}${month}${sequential}`;
      await ruta.save();
      console.log(`✅ Migrada ruta ${ruta._id} -> ${ruta.numeroRuta}`);
    }

    console.log("\n✅ Migración completada exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

migrateRutas();
