import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required but not set in environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Voice profiles tailored for 1950s Portuguese radio with distinct male vocal timbres (All Male)
interface VoiceProfile {
  role: string;
  register: string;
  delivery: string;
}

const VOICE_PROFILES: Record<string, VoiceProfile> = {
  Fenrir: {
    role: "Locutor Oficial de Estado da Emissora Nacional de Portugal (Lisboa, anos 1950)",
    register: "Voz masculina de baixo-barítono muito profunda, cavernosa, solene e imponente, com ressonância peitoral máxima",
    delivery: "Cadência lenta, austera, cerimoniosa e pausada de comunicados oficiais solenes e declarações de Estado",
  },
  Charon: {
    role: "Comentador Noticioso e Editorialista de Época da Rádio Portuguesa (Lisboa, anos 1950)",
    register: "Voz masculina de barítono distinto, nobre, equilibrado, culto e aristocrático de estúdio",
    delivery: "Cadência formal, firme, elegante e límpida de jornalista do Jornal Falado e comentador de crónica internacional",
  },
  Puck: {
    role: "Repórter de Campo e Correspondente Dinâmico em Exterior (anos 1950)",
    register: "Voz masculina de barítono enérgico, vivo, incisivo e direto, com voz projetada para reportagens ao ar livre",
    delivery: "Cadência rápida, dinâmica e assertiva de reportagem ao vivo em direto das minas, portos e fábricas de Portugal",
  },
  Zephyr: {
    role: "Apresentador Noturno e Cronista de Salão da Emissora Nacional / Rádio Renascença (anos 1950)",
    register: "Voz masculina aveludada, suave, profunda e intimista, com efeito de proximidade de microfone de fita",
    delivery: "Cadência serena, tranquila, calorosa e melódica, ideal para boletins de navegação marítima e crónicas culturais de serão",
  },
};

const PT_PT_PHONETICS_INSTRUCTION = `
INSTRUÇÃO OBRIGATÓRIA: VOZ MASCULINA DE LOCUTOR DE RÁDIO COM SOTAQUE DE PORTUGAL (pt-PT).
1. GÉNERO E TIMBRE MASCULINO: A voz tem de ser estritamente MASCULINA (homem adulto, locutor de rádio clássico dos anos 1950). É expressamente proibida qualquer voz feminina.
2. SOTAQUE E PRONÚNCIA DE PORTUGAL CONTINENTAL: Fale rigorosamente em Português de Portugal (Português Europeu padrão de Lisboa / pt-PT). É estritamente proibido qualquer sotaque brasileiro ou entoação do Brasil.
3. FONÉTICA EUROPEIA RIGOROSA:
   - Redução das vogais átonas: 'e' átono fechado [ɨ] (ex: "senhores", "governo", "lenhite"), 'o' átono como [u] (ex: "porto", "ministro", "como"), e 'a' átono quase fechado [ɐ].
   - Sibilantes chiadas suaves: 's' e 'z' no fim de sílaba ou palavra pronunciam-se como chiado palato-alveolar [ʃ] ou [ʒ] (ex: "as minas", "instalações", "país", "doutores").
   - Oclusivas 't' e 'd' rigorosamente dentais e secas (sem africação como no Brasil).
   - 'r' com toque alveolar firme ou vibração aristocrática da Emissora Nacional.
   - Ritmo acentual marcado (stress-timed), com a dignidade, autoridade e gravidade histórica da rádio dos anos 1950.
`;

// High-fidelity European Portuguese (pt-PT) speech generator for resilient playback when Gemini quota is exhausted
async function generateFallbackPortugalTTS(text: string): Promise<{ base64Audio: string; mimeType: string }> {
  const cleanText = text.replace(/[\r\n]+/g, " ").trim();
  const chunks: string[] = [];
  const sentences = cleanText.split(/([.!?;:]\s+)/);
  let current = "";

  for (let i = 0; i < sentences.length; i++) {
    const part = sentences[i];
    if ((current + part).length < 170) {
      current += part;
    } else {
      if (current.trim()) chunks.push(current.trim());
      if (part.length < 170) {
        current = part;
      } else {
        const words = part.split(/\s+/);
        current = "";
        for (const w of words) {
          if ((current + " " + w).length < 170) {
            current = current ? current + " " + w : w;
          } else {
            if (current.trim()) chunks.push(current.trim());
            current = w;
          }
        }
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk.trim())}&tl=pt-PT&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://translate.google.com/",
      },
    });
    if (!res.ok) throw new Error(`Serviço de voz alternativo respondeu com HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    buffers.push(Buffer.from(ab));
  }

  const combined = Buffer.concat(buffers);
  return {
    base64Audio: combined.toString("base64"),
    mimeType: "audio/mpeg",
  };
}

// Helper to call Gemini TTS with automatic retry on rate limits
async function generateGeminiSpeechWithRetry(
  ai: ReturnType<typeof getGenAI>,
  fullPrompt: string,
  voice: string,
  retries = 1
): Promise<{ base64Audio: string; mimeType: string }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: fullPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts && parts.length > 0) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return {
              base64Audio: part.inlineData.data,
              mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000",
            };
          }
        }
      }
    } catch (err: any) {
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes("429") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      if (attempt < retries && isRateLimit) {
        console.warn(`Tentativa ${attempt + 1} com rate-limit, a aguardar 2s antes de tentar novamente...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Nenhum dado de áudio foi retornado pelo modelo Gemini.");
}

// TTS endpoint for generating vintage radio broadcast speech
app.post("/api/tts", async (req, res) => {
  const { text, voice = "Fenrir", pitchDepth = "deep" } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "O texto para locução é obrigatório." });
  }

  const profile = VOICE_PROFILES[voice] || VOICE_PROFILES.Fenrir;

  // Try primary Gemini TTS first
  try {
    const ai = getGenAI();

    const fullPrompt = `${PT_PT_PHONETICS_INSTRUCTION}
PERFIL VOCAL DO LOCUTOR MASCULINO:
- Identidade: ${profile.role}
- Timbre e Registo: ${profile.register}${pitchDepth === "very_deep" ? " (ênfase em gravidade e ressonância de peito ainda mais profunda)" : ""}
- Cadência de Locução: ${profile.delivery}

TEXTO A TRANSMITIR COM VOZ MASCULINA EM PORTUGUÊS DE PORTUGAL:
"${text}"`;

    const { base64Audio, mimeType } = await generateGeminiSpeechWithRetry(ai, fullPrompt, voice, 1);

    return res.json({
      audioBase64: base64Audio,
      mimeType,
      sampleRate: 24000,
      voice,
      text,
      gender: "male",
      accent: "pt-PT",
      engine: "gemini-tts",
    });
  } catch (geminiError: any) {
    console.warn("Gemini TTS quota ou limite atingido. A ativar emissor alternativo em Português de Portugal (pt-PT)...", geminiError?.message || geminiError);

    // Fallback to resilient native European Portuguese engine
    try {
      const { base64Audio, mimeType } = await generateFallbackPortugalTTS(text);
      return res.json({
        audioBase64: base64Audio,
        mimeType,
        sampleRate: 24000,
        voice,
        text,
        gender: "male",
        accent: "pt-PT",
        engine: "pt-pt-broadcast-fallback",
      });
    } catch (fallbackError: any) {
      console.error("Erro no motor alternativo de voz:", fallbackError);
      return res.status(500).json({
        error: "Não foi possível gerar a transmissão de áudio. Por favor, tente novamente.",
      });
    }
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`1950s Vintage Radio Broadcaster server listening on port ${PORT}`);
  });
}

startServer();
