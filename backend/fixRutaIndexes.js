// Script para limpiar índices antiguos de la colección rutas
// Ejecutar este script UNA VEZ para resolver el problema de duplicados

const mongoose = require("mongoose");
const { Ruta } = require("./backend");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/ultimamillav2";

async function fixIndexes() {
  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    console.log("\n📋 Índices actuales en la colección rutas:");
    const indexes = await Ruta.collection.getIndexes();
    console.log(JSON.stringify(indexes, null, 2));

    console.log("\n🗑️  Eliminando todos los índices excepto _id...");
    await Ruta.collection.dropIndexes();
    console.log("✅ Índices eliminados");

    console.log("\n🔨 Recreando índices correctos...");
    await Ruta.syncIndexes();
    console.log("✅ Índices recreados");

    console.log("\n📋 Índices nuevos:");
    const newIndexes = await Ruta.collection.getIndexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log("\n✅ Proceso completado exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixIndexes();
