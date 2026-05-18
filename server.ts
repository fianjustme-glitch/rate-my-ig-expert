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
      const { images } = req.body; // Array of data URLs

      if (!images || images.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      const systemInstruction = `
        Bertindaklah sebagai seorang Instagram Expert, Creative Director, dan Fotografer Profesional. 
        Analisis screenshot profil dan feeds Instagram ini. Berikan penilaian yang detail, objektif, 
        namun tetap santai. Gunakan bahasa anak muda Indonesia yang santai (Gue/Lo atau santai saja), 
        gunakan emoji secukupnya, dan hindari bahasa kaku.
      `;

      const prompt = `
        Analisis profil IG ini dan kembalikan respon dalam format JSON yang valid dengan field: 
        1. firstImpression: Kesan pertama (vibes utama).
        2. bioReview: Penilaian foto profil dan bio.
        3. feedAesthetic: Nilai kerapian feeds, pencahayaan, dan konsistensi warna.
        4. finalScore: Rating angka 1-10.
        5. finalScoreReason: Alasan singkat score tersebut.
        6. proTips: Array berisi 3 saran konkret.
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
        // Fallback for raw base64
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
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              firstImpression: { type: "STRING" },
              bioReview: { type: "STRING" },
              feedAesthetic: { type: "STRING" },
              finalScore: { type: "NUMBER" },
              finalScoreReason: { type: "STRING" },
              proTips: {
                type: "ARRAY",
                items: { type: "STRING" }
              }
            },
            required: ["firstImpression", "bioReview", "feedAesthetic", "finalScore", "finalScoreReason", "proTips"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Gagal menganalisis profil IG. Pastikan gambar yang diupload jelas." });
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
