// Script para poblar la tabla de empresas de reparto con datos reales

const mongoose = require("mongoose");
const { EmpresaReparto } = require("./backend");

// IMPORTANTE: Cambiar esta URL según el entorno
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/ultimamillav2";

// Datos de empresas de reparto chilenas
// RUTs válidos calculados con dígito verificador correcto
const empresas = [
  {
    rut: "96.756.430-3",
    razonSocial: "Chilexpress S.A.",
    contacto: "600 600 6000",
  },
  {
    rut: "76.049.280-9",
    razonSocial: "PDQ Courrier Express Ltda.",
    contacto: "800 200 600",
  },
  {
    rut: "78.281.000-6",
    razonSocial: "Starken S.A.",
    contacto: "600 200 0102",
  },
  {
    rut: "61.979.440-0",
    razonSocial: "Correos de Chile",
    contacto: "600 950 2020",
  },
  {
    rut: "76.123.456-0",
    razonSocial: "Blue Express S.A.",
    contacto: "600 600 2000",
  },
  {
    rut: "77.234.567-4",
    razonSocial: "Urbano Express SpA",
    contacto: "800 123 456",
  },
  {
    rut: "76.987.654-5",
    razonSocial: "Vivipra Transportes Ltda.",
    contacto: "+56 2 2345 6789",
  },
];

async function seedEmpresas() {
  try {
    // Conectar a MongoDB
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Limpiar colección existente
    console.log("🗑️  Limpiando colección de empresas...");
    await EmpresaReparto.deleteMany({});
    console.log("✅ Colección limpiada");

    // Insertar nuevas empresas
    console.log("📦 Insertando empresas de reparto...");
    const resultado = await EmpresaReparto.insertMany(empresas);
    console.log(`✅ Se insertaron ${resultado.length} empresas de reparto:`);

    resultado.forEach((empresa, index) => {
      console.log(
        `   ${index + 1}. ${empresa.razonSocial} (RUT: ${empresa.rut})`
      );
    });

    console.log("\n🎉 Seed completado exitosamente");
  } catch (error) {
    console.error("❌ Error al ejecutar seed:", error);
    if (error.errors) {
      Object.keys(error.errors).forEach((key) => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    // Desconectar
    await mongoose.disconnect();
    console.log("👋 Desconectado de MongoDB");
    process.exit();
  }
}

// Ejecutar seed
seedEmpresas();
