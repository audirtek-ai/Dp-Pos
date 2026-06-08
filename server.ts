import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Shared Gemini client setup server-side only
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// JSON Response Schema for consistent frontend mapping
const restockResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { 
      type: Type.STRING, 
      description: "Ringkasan analisis inventori komprehensif dalam bahasa Indonesia." 
    },
    alertsCount: { 
      type: Type.INTEGER, 
      description: "Jumlah total bahan baku yang berada dalam kategori kritis." 
    },
    restockItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ingredientId: { type: Type.STRING },
          ingredientName: { type: Type.STRING },
          currentStock: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          salesVelocity: { 
            type: Type.NUMBER, 
            description: "Pemakaian rata-rata per hari berdasarkan rentang tanggal riwayat transaksi." 
          },
          daysLeft: { 
            type: Type.NUMBER, 
            description: "Sisa hari persediaan sebelum habis berdasarkan stok saat ini / kecepatan konsumsi." 
          },
          recommendedRestockDate: { 
            type: Type.STRING, 
            description: "Tanggal usulan belanja ulang (contoh: '9 Juni 2026' atau 'Segera')." 
          },
          restockAction: { 
            type: Type.STRING, 
            description: "Pilihan aksi: 'CRITICAL', 'WARNING', atau 'SAFE'." 
          },
          recommendedQty: { 
            type: Type.NUMBER, 
            description: "Jumlah kuantitas belanja yang direkomendasikan agar aman untuk 14 hari operasional." 
          },
          estimatedCost: { 
            type: Type.NUMBER, 
            description: "Estimasi biaya restock (recommendedQty * harga beli satuan bahan)." 
          },
          reasoning: { 
            type: Type.STRING, 
            description: "Justifikasi spesifik detail rekomendasi dalam bahasa Indonesia." 
          }
        },
        required: [
          "ingredientId", 
          "ingredientName", 
          "currentStock", 
          "unit", 
          "salesVelocity", 
          "daysLeft", 
          "recommendedRestockDate", 
          "restockAction", 
          "recommendedQty", 
          "estimatedCost", 
          "reasoning"
        ]
      }
    },
    insights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-3 wawasan strategis optimasi rantai pasokan bahan baku toko berdasarkan penjualan terpopuler."
    }
  },
  required: ["summary", "alertsCount", "restockItems", "insights"]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set standard body parser for bulk operations
  app.use(express.json({ limit: '10mb' }));

  // API Route: Restock advisory analysis utilizing Gemini API
  app.post("/api/gemini/restock-analysis", async (req, res) => {
    try {
      const { ingredients, products, transactions } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi di server. Silakan hubungkan API Key melalui menu Settings > Secrets."
        });
      }

      if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({ error: "Data bahan baku (ingredients) wajib dikirimkan." });
      }

      const prompt = `
Analisis riwayat penjualan kasir, formula resep produk, dan level stok bahan baku kami saat ini untuk memberikan estimasi kecepatan penjualan (sales velocity) bahan baku dan kapan kami harus melakukan restock (belanja kembali).

Aturan logika analisis bisnis:
1. Hitung konsumsi bahan baku dari setiap transaksi terjual:
   Setiap item transaksi memiliki productId dan quantity terjual.
   Cari kecocokan id produk tersebut pada daftar 'products'.
   Setiap produk memiliki RecipeItem (ingredients) dengan formulasi kebutuhan 'amountNeeded' per 'batchSize' (jumlah unit dalam 1 batch produksi).
   Konsumsi bahan baku = (amountNeeded / batchSize) * kuantitas produk terjual.
2. Hitung total konsumsi untuk tiap bahan baku (aggregated) sepanjang riwayat transaksi.
3. Estimasi 'salesVelocity' berupa rerata konsumsi per hari:
   salesVelocity = Total Konsumsi / Rentang Hari Transaksi (jika rentang transaksi kurang dari 1 hari atau semua di hari yang sama, asumsikan rentang = 1 hari).
4. Estimasi 'daysLeft' (Sisa hari stok):
   daysLeft = currentStock / salesVelocity.
   - Jika salesVelocity = 0, beri daysLeft = 999 dan restockAction = 'SAFE'.
5. Klasifikasikan 'restockAction' (Urgensi Restock):
   - 'CRITICAL': Jika daysLeft <= 2, ATAU jika currentStock < minStock dan kecepatan konsumsi tinggi.
   - 'WARNING': Jika daysLeft <= 5, ATAU jika currentStock < minStock.
   - 'SAFE': Jika daysLeft > 5 dan currentStock >= minStock.
6. Rekomendasi belanja ulang 'recommendedQty' untuk menjamin keamanan suplai operasional selama 14 hari ke depan:
   - recommendedQty = (salesVelocity * 14) - currentStock. Jika hasilnya <= 0, recommendedQty = 0. Bulatkan nilainya ke atas/ke angka terdekat yang proporsional.
7. Hitung 'estimatedCost' = recommendedQty * harga beli bahan per satuan.

Berikut data aktual dari sistem Kasir Pintar HPPOS:

--------------------------------------------------
1. INGREDIENTS (Daftar persediaan bahan baku saat ini):
${JSON.stringify(ingredients, null, 2)}

2. PRODUCTS (Formulasi menu & kebutuhan bahan resep):
${JSON.stringify(products, null, 2)}

3. TRANSACTIONS (Riwayat penjualan transaksi kasir):
${JSON.stringify(transactions, null, 2)}
--------------------------------------------------

Gunakan kecerdasan analitik Anda untuk menghasilkan estimasi tanggal restock yang logis dan andal. Berikan ringkasan (summary) dan wawasan (insights) strategis yang berguna untuk menekan angka sisa bahan (waste), meningkatkan efisiensi modal belanja, dan menjamin ketersediaan produksi.

Respon wajib berformat JSON rapi yang sesuai dengan skema respons yang ditentukan. Semua penjelasan disajikan dalam bahasa Indonesia yang ramah, sopan, dan profesional bagi pelaku UMKM.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Anda adalah analis inventori pintar, pengolah rasio perputaran barang dilarang keras berupaya merekayasa output selain JSON. Output WAJIB berupa JSON sesuai skema saja.",
          responseMimeType: "application/json",
          responseSchema: restockResponseSchema
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());

      return res.json(parsedData);
    } catch (err: any) {
      console.error("Gemini Restock API Error:", err);
      return res.status(500).json({
        error: err.message || "Gagal mengalkulasi rekomendasi restock bahan baku dengan Gemini."
      });
    }
  });

  // Serve static assets and routing based on env
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HPPOS Server running on port ${PORT} with environment ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
