require("dotenv").config();
const express = require("express");
const app = express();
const { z } = require("zod");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.query("SELECT NOW()").then(resultado => {
    console.log("Conectado a PostgreSQL:", resultado.rows[0]);
});

app.use(express.json());

const filtroSchema = z.object({
    disponible: z.enum(["true", "false"]).transform((valor) => valor === "true").optional(),
    categoria: z.string().min(1).optional(),
});

const idSchema = z.coerce.number().int().positive();

const equipoSchema = z.object({
    nombre: z.string().min(1),
    categoria: z.string().min(1),
    precioAlquiler: z.number().min(0),
});

const equipoUpdateSchema = equipoSchema
  .extend({ disponible: z.boolean() })
  .partial();

app.get("/equipos", async (req, res) => {
    const validateFilter = filtroSchema.safeParse(req.query);
    if (!validateFilter.success){
        return res.status(400).json({error: "filtro inválido", detalles: validateFilter.error.issues});
    }
    let consulta = `SELECT id, nombre, categoria, precio_alquiler AS "precioAlquiler", disponible FROM equipos`;
    const valores = [];
    const condiciones =[];
    if (validateFilter.data.categoria) {
        valores.push(validateFilter.data.categoria);
        condiciones.push(`categoria = $${valores.length}`);
    }
    if (validateFilter.data.disponible !== undefined){
        valores.push(validateFilter.data.disponible);
        condiciones.push(`disponible = $${valores.length}`);
    }
    if (condiciones.length > 0){
        consulta = consulta + " WHERE " + condiciones.join(" AND ");
    }
    consulta = consulta + ` ORDER BY id`;
    const resultado = await pool.query(consulta, valores);
    res.json(resultado.rows);
});

app.get("/equipos/:id", async (req, res) => {
    const validateId = idSchema.safeParse(req.params.id);
    if (!validateId.success) {
        return res.status(400).json({ error: "ID inválido", detalles: validateId.error.issues});
    }
    const resultado = await pool.query(`SELECT id, nombre, categoria, precio_alquiler AS "precioAlquiler", 
        disponible FROM equipos WHERE id = $1`, 
        [validateId.data]
    );
    const equipo = resultado.rows[0];
    if (!equipo) {
        return res.status(404).json({ error: "Equipo no encontrado" });
    }
    res.json(equipo);
});

app.post("/equipos", async (req, res) => {
    const resultado = equipoSchema.safeParse(req.body); 
    if (!resultado.success){
        return res.status(400).json({error: "Datos inválidos", detalles: resultado.error.issues });
    }
    const consulta  = await pool.query(`INSERT INTO equipos(nombre, categoria, precio_alquiler)
        VALUES ($1, $2, $3)
        RETURNING id, nombre, categoria, precio_alquiler AS "precioAlquiler", disponible`,
        [resultado.data.nombre, resultado.data.categoria, resultado.data.precioAlquiler]
    );
    const nuevoEquipo = consulta.rows[0];
    res.status(201).json(nuevoEquipo);
});

app.delete("/equipos/:id", async (req, res) => {
    const validateId = idSchema.safeParse(req.params.id);
    if (!validateId.success){
        return res.status(400).json({ error: "ID inválido", detalles: validateId.error.issues });
    }
    const consulta = await pool.query(`DELETE FROM equipos WHERE id = $1`, [validateId.data]);
    if (consulta.rowCount === 0){
        return res.status(404).json ({error: "Equipo no encontrado ni eliminado"});
    }
    res.status(204).send();
});

app.patch("/equipos/:id", async (req, res) => {
    const validateId = idSchema.safeParse(req.params.id);
    if (!validateId.success){
        return res.status(400).json({ error: "ID inválido", detalles: validateId.error.issues });
    }
    const resultado = equipoUpdateSchema.safeParse(req.body);
    if (!resultado.success){
        return res.status(400).json({error: "Datos inválidos", detalles: resultado.error.issues});
    }
    const valores = [];
    const cambios = [];
    if (resultado.data.nombre !== undefined) {
        valores.push(resultado.data.nombre);
        cambios.push(`nombre = $${valores.length}`);
    }
    if (resultado.data.categoria !== undefined) {
        valores.push(resultado.data.categoria);
        cambios.push(`categoria = $${valores.length}`);
    }
    if (resultado.data.precioAlquiler !== undefined) {
        valores.push(resultado.data.precioAlquiler);
        cambios.push(`precio_alquiler = $${valores.length}`);
    }
    if (resultado.data.disponible !== undefined) {
        valores.push(resultado.data.disponible);
        cambios.push(`disponible = $${valores.length}`);
    }

    if (cambios.length === 0){
        return res.status(400).json({error: "No hay campos para actualizar"});
    }
    valores.push (validateId.data);

    const consulta = await pool.query(
        `UPDATE equipos SET ${cambios.join(", ")} WHERE id = $${valores.length}
        RETURNING id, nombre, categoria, precio_alquiler AS "precioAlquiler", disponible`,
        valores
    );
    const equipo = consulta.rows[0];
    if (!equipo) {
        return res.status(404).json({ error: "Equipo no encontrado" });
    }
    res.json(equipo);
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
