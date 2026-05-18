import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Gemini API Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/rate-ig", async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const systemInstruction = `
      Bertindaklah sebagai seorang Instagram Expert, Creative Director, dan Fotografer Profesional. 
      Analisis profil IG ini dan berikan penilaian yang detail dan objektif dalam format JSON.
      Gunakan bahasa Indonesia yang santai tapi profesional (ala Creative Agency).
    `;

    const prompt = `
      Kembalikan respon dalam format JSON yang valid:
      {
        "firstImpression": "...",
        "bioReview": "...",
        "feedAesthetic": "...",
        "finalScore": 8.5,
        "finalScoreReason": "...",
        "proTips": ["...", "...", "..."]
      }
    `;

    const parts = images.map((img: string) => {
      const match = img.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return {
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        };
      }
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: img
        }
      };
    });

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Gagal menganalisis profil IG. Coba lagi nanti." });
  }
});

async function start() {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only start listening if NOT on Vercel or if explicitly running locally
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

start();

export default app;
