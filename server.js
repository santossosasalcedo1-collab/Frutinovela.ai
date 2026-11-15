import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const hits = new Map();
app.use((req, res, next) => {
  if (req.path !== "/generar") return next();
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const old = hits.get(ip) || [];
  const recent = old.filter(t => now - t < 15 * 60 * 1000);
  if (recent.length >= 12) return res.status(429).json({ error: "Demasiadas solicitudes. Espera unos minutos e inténtalo otra vez." });
  recent.push(now); hits.set(ip, recent); next();
});

app.get("/", (_req, res) => res.type("text").send("Servidor de Frutinovelas IA activo."));
app.get("/salud", (_req, res) => res.json({ ok: true }));

app.post("/generar", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Falta configurar OPENAI_API_KEY en las variables secretas del servidor." });
    const prompt = String(req.body?.prompt || "").trim();
    const total = Math.max(20, Math.min(600, Number(req.body?.totalSeconds) || 191));
    const mode = req.body?.mode === "next" ? "next" : "new";
    const previous = req.body?.previous || null;
    if (!prompt && mode !== "next") return res.status(400).json({ error: "Escribe una idea para la historia." });

    const lineCount = Math.max(5, Math.min(60, Math.round(total / 6.2)));
    const continuation = mode === "next" && previous
      ? `\nCONTINÚA UNA SERIE EXISTENTE. Conserva los personajes y sus rasgos: ${JSON.stringify(previous.characters || [])}. Resumen anterior: ${JSON.stringify(previous.episodes || [])}. No reinicies la historia; crea un capítulo nuevo que continúe los hechos.`
      : "\nCrea una historia completamente nueva. Evita repetir nombres y diseños típicos; inventa un reparto diferente para esta petición.";

    const instructions = `Eres guionista, director de escenas y planificador de animación para una serie de historias dramáticas, divertidas y cinematográficas, con personajes parlantes. El usuario puede pedir frutas, verduras, animales, objetos, criaturas originales o cualquier mezcla. Sigue el prompt del usuario para apariencia, ropa, accesorios, entorno y acciones. No uses emojis ni caritas dibujadas como sustituto de personajes. Los personajes deben tener cuerpos y rostros expresivos.
Genera exactamente ${lineCount} líneas en español latino, con inicio, conflicto, giro y desenlace o gancho. Cada línea debe tener entre 10 y 22 palabras. Alterna diálogos y narrador. Planifica acción visible: caminar, correr, saltar, bailar, llorar, temblar, volar, girar, saludar, pelear de forma caricaturesca y abrazar. No dejes a todos inmóviles. Varía escenarios y efectos cuando la historia lo necesite.
Devuelve SOLO un objeto JSON válido con esta estructura:
{
"title":"título",
"summary":"resumen de dos frases",
"narratorVoice":"cueva|grave|normal",
"characters":[
{"name":"nombre único","kind":"fruta|verdura|animal|objeto|inventado","color":"#hex","color2":"#hex","width":1,"height":1,"pattern":"none|puntos|rayas","ears":"none|gato|conejo|oso|cuernos|antenas","tail":false,"accessory":"none|sombrero|corona|gafas|bigote|lazo|casco|capa|corbata","voice":"agudo|normal|grave|robotico|cueva|bestia|nino|susurro","textColor":"#hex"}
],
"lines":[
{"speaker":"nombre de personaje o Narrador","text":"texto","emotion":"happy|sad|angry|surprised","place":"ciudad|bosque|playa|cocina|noche|castillo|espacio|campo|cueva|fiesta","fx":"none|lluvia|nieve|corazones|confeti|chispas|humo|estrellas|rayos","present":["nombres de personajes"],"actions":{"nombre":"caminar|correr|saltar|bailar|llorar|temblar|volar|girar|saludar|pelear|abrazar"}}
]}
Incluye de 2 a 5 personajes salvo que el usuario pida otra cosa. Los nombres de speaker y actions deben coincidir exactamente con characters[].name. Usa colores de texto claros y distintos. Presenta los cambios de lugar, acciones y efectos en las líneas apropiadas.`;

    const response = await client.responses.create({
      model: MODEL,
      instructions,
      input: `IDEA DEL USUARIO: ${prompt || "Continúa la serie con un giro inesperado."}${continuation}`,
      text: { format: { type: "json_object" } }
    });

    let raw = response.output_text;
    if (!raw) {
      const chunks = [];
      for (const item of response.output || []) for (const c of item.content || []) if (c.text) chunks.push(c.text);
      raw = chunks.join("\n");
    }
    const script = JSON.parse(raw);
    if (!Array.isArray(script.characters) || !Array.isArray(script.lines) || !script.characters.length || !script.lines.length) {
      throw new Error("La IA devolvió un guion incompleto. Inténtalo de nuevo.");
    }
    res.json({ script });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err?.message || "No se pudo generar la historia." });
  }
});

app.listen(PORT, () => console.log(`Frutinovelas IA escuchando en ${PORT}`));
