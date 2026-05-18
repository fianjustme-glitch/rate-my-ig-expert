import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
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

    const imageParts = images.map((img: string) => {
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const jsonData = JSON.parse(response.text || '{}');
    res.json(jsonData);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Gagal menganalisis profil IG. Pastikan gambar jelas." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
