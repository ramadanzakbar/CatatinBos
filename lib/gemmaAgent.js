/**
 * Google Agent Development Kit Integration using Gemma 4 26B A4B IT
 * API Service wrapper with Multimodal & Tool Calling Capabilities
 */

export async function callGemmaAgent({ prompt, imageBase64, tools }) {
  const apiKey = process.env.GEMMA_API_KEY;

  if (!apiKey) {
    // Fallback simulation mode if API key is not configured yet
    return {
      text: "Modul Gemma 4 26B A4B IT aktif (Mode Simulasi API). Silakan atur GEMMA_API_KEY di .env untuk integrasi live.",
      toolCalls: []
    };
  }

  try {
    const payload = {
      model: "gemma-4-26b-a4b-it",
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
