/**
 * Google Agent Development Kit Integration using Gemma 4 26B A4B IT
 * API Service wrapper with Multimodal, Function Calling & Autonomous Financial Advisor Capabilities
 */

export async function callGemmaAgent({ prompt, imageBase64, tools }) {
  const apiKey = process.env.GEMMA_API_KEY;

  const systemInstruction = `Kamu adalah Gemma 4 AI Financial Planner & Personal Wealth Advisor cerdas untuk aplikasi "Catatin".
Tugas utamamu:
1. Tidak hanya mencatat atau membaca struk belanja, tetapi juga menganalisis kondisi keuangan pengguna.
2. Menerapkan metode penganggaran 50/30/20 (50% Kebutuhan Pokok/Needs, 30% Keinginan/Wants, 20% Tabungan & Investasi/Savings).
3. Menggunakan Tool Calling (function declarations) untuk menambahkan transaksi, menganalisis kesehatan keuangan (analyze_financial_health), mengatur pagu anggaran (set_budget_limit), dan memproyeksikan cashflow (generate_cashflow_forecast).
4. Memberikan saran finansial yang ramah, taktis, solutif, dan mendorong kebiasaan menabung yang sehat dalam Bahasa Indonesia.`;

  if (!apiKey) {
    // Simulation / Fallback response with Tool Execution simulation if API key is not configured yet
    const textLower = prompt.toLowerCase();
    let simulatedCall = null;

    if (textLower.includes('analisis') || textLower.includes('kesehatan') || textLower.includes('50/30/20')) {
      simulatedCall = { name: 'analyze_financial_health', args: {} };
    } else if (textLower.includes('budget') || textLower.includes('batas') || textLower.includes('pagu')) {
      simulatedCall = { name: 'set_budget_limit', args: { category: 'Food', limitAmount: 1500000 } };
    } else if (textLower.includes('forecast') || textLower.includes('target') || textLower.includes('proyeksi')) {
      simulatedCall = { name: 'generate_cashflow_forecast', args: { targetGoalName: 'Dana Darurat' } };
    }

    return {
      text: "Saya telah menganalisis data keuangan Anda menggunakan metode 50/30/20. Disarankan untuk memprioritaskan alokasi 20% untuk tabungan dan menjaga pengeluaran kategori Makanan di bawah pagu anggaran.",
      toolCalls: simulatedCall ? [simulatedCall] : []
    };
  }

  try {
    const payload = {
      model: "gemma-4-26b-a4b-it",
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...(imageBase64 ? [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }] : [])
          ]
        }
      ],
      tools: tools ? [{ function_declarations: tools }] : undefined
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const candidate = data?.candidates?.[0];

    return {
      text: candidate?.content?.parts?.[0]?.text || "Gemma Agent memproses respons.",
      toolCalls: candidate?.content?.parts?.[0]?.functionCall ? [candidate.content.parts[0].functionCall] : []
    };
  } catch (error) {
    console.error("Gemma Agent API Error:", error);
    return {
      text: "Terjadi kesalahan saat berkomunikasi dengan Gemma 4 API service.",
      toolCalls: []
    };
  }
}
