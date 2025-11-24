// Agregar este endpoint después del PUT /api/rutas/:id en server.js

// POST /api/rutas/:id/cancelar - Cancelar ruta y liberar despachos no entregados
app.post(
  "/api/rutas/:id/cancelar",
  authMiddleware,
  requireRoles(["admin", "adminBodega", "subBodega"]),
  async (req, res) => {
    try {
      const ruta = await Ruta.findById(req.params.id).populate("despachos");

      if (!ruta) {
        return res.status(404).json({
          status: "error",
          message: "Ruta no encontrada",
        });
      }

      // Obtener despachos de la ruta
      const despachosIds = ruta.despachos.map(d => d._id || d);

      // Obtener despachos que no están entregados
      const despachosNoEntregados = await Despacho.find({
        _id: { $in: despachosIds },
        estado: { $ne: "entregado" }
      });

      console.log(`📦 Liberando ${despachosNoEntregados.length} despachos no entregados de la ruta ${ruta.numeroRuta}`);

      // Liberar despachos no entregados (volver a estado pendiente)
      await Despacho.updateMany(
        {
          _id: { $in: despachosNoEntregados.map(d => d._id) }
        },
        {
          $set: {
            estado: "pendiente",
            rutaAsignada: null,
            empresaReparto: null
          }
        }
      );

      // Cambiar estado de la ruta a cancelada (agregar este campo al schema)
      ruta.estado = "cancelada";
      await ruta.save();

      res.json({
        status: "success",
        message: "Ruta cancelada exitosamente",
        data: {
          ruta,
          despachosLiberados: despachosNoEntregados.length
        }
      });
    } catch (error) {
      console.error("❌ Error al cancelar ruta:", error);
      res.status(500).json({
        status: "error",
        message: "Error al cancelar ruta",
        error: error.message,
      });
    }
  }
);
