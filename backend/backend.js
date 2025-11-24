// ===== MODELOS DE MONGOOSE PARA LA BASE DE DATOS =====
// Este archivo contiene todos los schemas y modelos de MongoDB

const mongoose = require("mongoose");

// ===== SCHEMA: EMPRESA DE REPARTO =====
const empresaRepartoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    rut: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    direccion: {
      type: String,
      trim: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contacto: {
      type: String,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: "empresasReparto", // Nombre de la colección en MongoDB
  }
);

// ===== SCHEMA: DESPACHO =====
const despachoSchema = new mongoose.Schema(
  {
    numeroDespacho: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fechaDespacho: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sucursal: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    destino: {
      type: String,
      required: true,
      trim: true,
    },
    cliente: {
      type: String,
      required: true,
      trim: true,
    },
    direccionEntrega: {
      type: String,
      required: true,
      trim: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "en_ruta", "entregado", "fallido"],
      default: "pendiente",
    },
    observaciones: {
      type: String,
      trim: true,
    },
    empresaReparto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmpresaReparto", // Referencia al modelo EmpresaReparto
    },
    rutaAsignada: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ruta", // Referencia al modelo Ruta
    },
  },
  {
    timestamps: true,
    collection: "despachos",
  }
);

// ===== SCHEMA: RUTA =====
const rutaSchema = new mongoose.Schema(
  {
    numeroRuta: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
    },
    chofer: {
      type: String,
      required: true,
      trim: true,
    },
    vehiculo: {
      type: String,
      required: true,
      trim: true,
    },
    patente: {
      type: String,
      required: true,
      trim: true,
    },
    empresaReparto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmpresaReparto",
      required: true,
    },
    despachos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Despacho",
      },
    ],
    estado: {
      type: String,
      enum: ["planificada", "en_curso", "completada", "cancelada"],
      default: "planificada",
    },
    observaciones: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "rutas",
  }
);

// ===== CREAR MODELOS =====
const EmpresaReparto = mongoose.model("EmpresaReparto", empresaRepartoSchema);
const Despacho = mongoose.model("Despacho", despachoSchema);
const Ruta = mongoose.model("Ruta", rutaSchema);

// ===== EXPORTAR MODELOS =====
module.exports = {
  EmpresaReparto,
  Despacho,
  Ruta,
};
