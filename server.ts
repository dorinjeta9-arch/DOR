import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

interface QuoteRequest {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  company?: string;
  technology: "FDM" | "SLA";
  material: string;
  finish: string;
  units: number;
  urgency: "normal" | "urgent";
  fileName: string;
  fileSize: number;
  volumeCm3: number;
  estimatedHours: number;
  estimatedPrice: number;
  status: "Recibida" | "En revisión" | "Presupuesto enviado" | "En fabricación" | "Finalizado";
  createdAt: string;
  adminNotes?: string;
}

let mockQuotes: QuoteRequest[] = [
  {
    id: "P3D-8821",
    clientName: "Carlos Méndez",
    email: "carlos.mendez@ingenieria.es",
    phone: "+34 600 123 456",
    company: "Méndez Robótica SL",
    technology: "FDM",
    material: "PETG Negro",
    finish: "Lijado y Pulido",
    units: 5,
    urgency: "normal",
    fileName: "soporte_brazo_robotico.stl",
    fileSize: 1420500,
    volumeCm3: 85.4,
    estimatedHours: 6.5,
    estimatedPrice: 62.50,
    status: "En revisión",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    adminNotes: "Revisando espesores de pared mínimos en la malla."
  },
  {
    id: "P3D-8822",
    clientName: "Elena Valls",
    email: "elena@vallsdesign.com",
    phone: "+34 655 987 321",
    company: "Valls Industrial Design",
    technology: "SLA",
    material: "Resina Estándar Gris",
    finish: "Imprimado / Pintado",
    units: 2,
    urgency: "urgent",
    fileName: "carcasa_sensor_optico.stl",
    fileSize: 4850000,
    volumeCm3: 32.1,
    estimatedHours: 4.2,
    estimatedPrice: 78.20,
    status: "Presupuesto enviado",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    adminNotes: "Presupuesto enviado por correo electrónico. Pendiente de transferencia."
  }
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const systemInstruction = `Eres el asistente virtual experto de "PROJET 3D", empresa especializada en fabricación aditiva, prototipado rápido y series cortas, situada en Polígono Industrial La Atalaya, C/ Avenida de los Trabajadores, nº 25.
Horario: Lunes a Viernes de 8:00 a 17:00 h. Email: contacto@projet3d.es.
Ofreces servicios de impresión 3D FDM (para piezas funcionales y grandes tamaños en PLA, ABS, PETG) y SLA/Resina (para alta precisión y acabados estéticos), además de asesoría CAD (DfAM) y post-procesado (lijado, pulido, pintado).
Tus respuestas deben ser profesionales, directas y cordiales, ayudando al cliente sobre exportación de archivos .STL, tecnologías y plazos. No inventes precios exactos ni datos comerciales que no tengas confirmados.`;

      const contents = [
        ...(history || []).map((h: any) => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
        { role: "user", parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text || "Lo siento, no he podido procesar tu respuesta en este momento." });
    } catch (err: any) {
      console.error("Chat error:", err);
      res.status(500).json({ error: err.message || "Error interno del servidor" });
    }
  });

  app.get("/api/quotes", (req, res) => {
    res.json(mockQuotes);
  });

  app.post("/api/quotes", (req, res) => {
    try {
      const data = req.body;
      const id = `P3D-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const volume = Number(data.volumeCm3) || 45.0;
      const hours = Number(data.estimatedHours) || 3.5;
      const factorMaterial = data.technology === 'SLA' ? 0.35 : 0.20;
      const basePrep = 15;
      const hourlyRate = 12;
      
      let subtotal = basePrep + (volume * factorMaterial) + (hours * hourlyRate);
      if (data.urgency === 'urgent') {
        subtotal *= 1.30;
      }
      const estimatedPrice = Math.round(subtotal * 100) / 100;

      const newQuote: QuoteRequest = {
        id,
        clientName: data.clientName || "Cliente Web",
        email: data.email || "",
        phone: data.phone || "",
        company: data.company || "",
        technology: data.technology || "FDM",
        material: data.material || "PLA Negro",
        finish: data.finish || "Básico / En Bruto",
        units: Number(data.units) || 1,
        urgency: data.urgency || "normal",
        fileName: data.fileName || "modelo.stl",
        fileSize: data.fileSize || 1048576,
        volumeCm3: volume,
        estimatedHours: hours,
        estimatedPrice,
        status: "Recibida",
        createdAt: new Date().toISOString(),
      };

      mockQuotes.unshift(newQuote);
      res.status(201).json(newQuote);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/quotes/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { status, estimatedPrice, adminNotes } = req.body;
      const quote = mockQuotes.find(q => q.id === id);
      if (!quote) {
        return res.status(404).json({ error: "Presupuesto no encontrado" });
      }
      if (status) quote.status = status;
      if (estimatedPrice !== undefined) quote.estimatedPrice = Number(estimatedPrice);
      if (adminNotes !== undefined) quote.adminNotes = adminNotes;
      
      res.json(quote);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PROJET 3D Server running on http://localhost:${PORT}`);
  });
}

startServer();
