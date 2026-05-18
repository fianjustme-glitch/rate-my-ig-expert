import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Gemini API Initialization
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
      const { images } = req.body; // Array of base64 image data

      if (!images || images.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      const prompt = `
        Bertindaklah sebagai seorang Instagram Expert, Creative Director, dan Fotografer Profesional. 
        Analisis screenshot profil dan feeds Instagram ini. Berikan penilaian yang detail, objektif, 
        namun tetap santai dengan struktur berikut:

        1. First Impression (Kesan Pertama): Apa vibes utama dari akun ini saat pertama kali dilihat? 
        2. Bio & Profile Picture Review: Penilaian apakah fotonya menarik dan bionya informatif/menjual.
        3. Feed Aesthetic & Color Palette: Nilai kerapian feeds, pencahayaan foto, dan konsistensi warna.
        4. Score Akhir: Rating skala 1-10 beserta alasannya.
        5. Pro Tips: 3 saran konkret agar akun terlihat lebih estetik atau profesional.

        Gunakan bahasa anak muda Indonesia yang santai, gunakan emoji secukupnya, dan hindari bahasa kaku.
        Kembalikan respon dalam format JSON yang valid dengan field: 
        firstImpression, bioReview, feedAesthetic, finalScore, finalScoreReason, proTips (array of string).
      `;

      const contents = {
        parts: [
          ...images.map((img: string) => ({
            inlineData: {
              mimeType: "image/jpeg",
              data: img.split(',')[1] || img // handle data-url or raw base64
            }
          })),
          { text: prompt }
        ]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [contents],
        config: {
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
