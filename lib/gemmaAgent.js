/**
 * Google Agent Development Kit Integration using Gemma 4 26B A4B IT / Vertex AI / Gemini API
 * API Service wrapper with Multimodal, Function Calling & Autonomous Financial Advisor Capabilities
 */

function parseInlineToolCalls(text) {
  const toolCalls = [];
  if (!text) return { cleanText: '', toolCalls };

  // Match Gemma 4 / Gemini inline tool call syntax, e.g., <|tool_call>call:catatin:add_transaction{...}<tool_call|>
  const regex = /(?:<\|tool_call\|?>?\s*)?call:(?:catatin:)?([a-zA-Z0-9_]+)\s*(\{[\s\S]*?\})\s*(?:<\|tool_call\|?>?)?/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    const rawArgs = match[2];
    let args = {};

    try {
      // Format loose JS object notation into valid JSON
      const formattedJson = rawArgs.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      args = JSON.parse(formattedJson);
    } catch (e) {
      console.warn('Failed parsing inline tool call args:', rawArgs);
    }

    toolCalls.push({ name, args });
  }

  // Remove raw tool call markup from displayed response text
  let cleanText = text
    .replace(/(?:<\|?tool_call\|?>?\s*)?call:(?:catatin:)?[a-zA-Z0-9_]+\{[\s\S]*?\}(?:<\|?tool_call\|?>?)?/g, '')
    .replace(/<\|?tool_call\|?>?/g, '')
    .trim();

  return { cleanText, toolCalls };
}

export async function callGemmaAgent({ prompt, imageBase64, tools }) {
  const apiKey = process.env.VERTEX_API_KEY || process.env.GEMMA_API_KEY || process.env.GEMINI_API_KEY;
  const bearerToken = process.env.VERTEX_BEARER_TOKEN || process.env.VERTEX_ACCESS_TOKEN || process.env.GCP_ACCESS_TOKEN || (apiKey && apiKey.startsWith('ya29.') ? apiKey : null);
  const projectId = process.env.VERTEX_PROJECT_ID || process.env.PROJECT_ID || process.env.GCP_PROJECT_ID;
  const region = process.env.VERTEX_REGION || process.env.REGION || process.env.VERTEX_LOCATION || 'us-central1';
  const vertexEndpoint = process.env.VERTEX_ENDPOINT || process.env.ENDPOINT || 'aiplatform.googleapis.com';
  const vertexModel = process.env.VERTEX_MODEL || 'google/gemma-4-26b-a4b-it-maas';

  let lastErrorMessage = 'API Key (GEMINI_API_KEY / GEMMA_API_KEY / VERTEX_API_KEY) belum dikonfigurasi di .env';

  const systemInstruction = `Kamu adalah Gemma 4 AI Financial Planner & Personal Wealth Advisor cerdas untuk aplikasi "Catatin".
Tugas utamamu:
1. Menganalisis kondisi keuangan pengguna dan membaca struk/catatan belanja.
2. Menerapkan metode penganggaran 50/30/20 (50% Kebutuhan Pokok/Needs, 30% Keinginan/Wants, 20% Tabungan & Investasi/Savings).
3. Menggunakan Tool Calling untuk menambahkan transaksi, menganalisis kesehatan keuangan (analyze_financial_health), mengatur pagu anggaran (set_budget_limit), dan memproyeksikan cashflow (generate_cashflow_forecast).
4. Memberikan saran finansial yang ramah, taktis, solutif, dan ringkas dalam Bahasa Indonesia menggunakan format Markdown yang rapi.`;

  // 1. Try Vertex AI Model-as-a-Service (MaaS) / OpenAPI Endpoint if Bearer Token & Project ID are provided
  if (bearerToken && projectId) {
    const maasHost = (region && region !== 'global') ? `${region}-${vertexEndpoint}` : vertexEndpoint;
    const maasLocation = (region && region !== 'global') ? region : 'global';
    
    try {
      const maasUrl = `https://${maasHost}/v1/projects/${projectId}/locations/${maasLocation}/endpoints/openapi/chat/completions`;
      const messages = [
        { role: 'system', content: systemInstruction },
        {
          role: 'user',
          content: imageBase64
            ? [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
              ]
            : prompt
        }
      ];

      const maasPayload = {
        model: vertexModel,
        stream: false,
        max_tokens: 2048,
        messages: messages,
      };

      const maasRes = await fetch(maasUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(maasPayload)
      });

      const contentType = maasRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const maasData = await maasRes.json();
        if (maasRes.ok && maasData?.choices?.[0]?.message) {
          const msg = maasData.choices[0].message;
          const msgContent = msg?.content || msg?.reasoning_content || '';
          const parsed = parseInlineToolCalls(msgContent);

          return {
            text: parsed.cleanText || "Transaksi & analisis Anda telah diproses oleh Gemma AI.",
            toolCalls: parsed.toolCalls
          };
        } else {
          lastErrorMessage = `Vertex MaaS Error (${maasRes.status}): ${maasData?.error?.message || maasRes.statusText}`;
          console.warn('Vertex MaaS request failed:', lastErrorMessage);
        }
      } else {
        lastErrorMessage = `Vertex MaaS Error (${maasRes.status}): Endpoint URL (${maasUrl}) mengembalikan konten non-JSON (${contentType || 'HTML'}).`;
        console.warn('Vertex MaaS non-JSON response:', lastErrorMessage);
      }
    } catch (err) {
      lastErrorMessage = `Vertex MaaS Connection Error: ${err.message}`;
      console.warn('Error calling Vertex AI MaaS endpoint:', err.message);
    }

    // Try Vertex AI Publisher Model REST endpoint with Bearer Token as fallback
    try {
      const publisherLocation = (region && region !== 'global') ? region : 'us-central1';
      const publisherHost = publisherLocation !== 'global' ? `${publisherLocation}-${vertexEndpoint}` : vertexEndpoint;
      const publisherUrl = `https://${publisherHost}/v1/projects/${projectId}/locations/${publisherLocation}/publishers/google/models/gemini-1.5-flash:generateContent`;

      const pubRes = await fetch(publisherUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      });

      if (pubRes.ok) {
        const pubData = await pubRes.json();
        const candidate = pubData?.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text || "";
        const parsed = parseInlineToolCalls(rawText);

        return {
          text: parsed.cleanText || rawText || "Transaksi & analisis Anda telah diproses oleh AI.",
          toolCalls: parsed.toolCalls
        };
      }
    } catch (pubErr) {
      console.warn('Vertex Publisher REST fallback failed:', pubErr.message);
    }
  }


  // 2. Direct API Key call (Generative Language API) - Try Gemma 4 & Gemini Flash models
  if (apiKey && !apiKey.startsWith('ya29.')) {
    const modelsToTry = ["gemma-4-26b-a4b-it", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];

    for (const modelName of modelsToTry) {
      try {
        const payload = {
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
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.2
          },
          ...(tools ? { tools: [{ function_declarations: tools }] } : {})
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok && data?.candidates?.[0]) {
          const candidate = data.candidates[0];
          const rawText = candidate?.content?.parts?.[0]?.text || "";
          const nativeFunctionCall = candidate?.content?.parts?.[0]?.functionCall;

          const parsed = parseInlineToolCalls(rawText);
          const finalToolCalls = nativeFunctionCall ? [nativeFunctionCall] : parsed.toolCalls;

          return {
            text: parsed.cleanText || rawText || "Transaksi & analisis Anda telah diproses oleh AI.",
            toolCalls: finalToolCalls
          };
        } else {
          lastErrorMessage = `Gemini API Error (${modelName} - ${response.status}): ${data?.error?.message || response.statusText}`;
          console.warn(`Model ${modelName} returned error:`, lastErrorMessage);
        }
      } catch (error) {
        lastErrorMessage = `API Connection Error (${modelName}): ${error.message}`;
        console.warn(`Attempt with ${modelName} encountered error:`, error.message);
      }
    }
  }

  // 3. Return explicit error message when all AI calls fail
  return {
    text: `⚠️ **Gagal Terhubung ke Model AI Agent**\n\n**Detail Error**: ${lastErrorMessage}\n\n*Silakan periksa ketersediaan API Key (\`GEMINI_API_KEY\` / \`VERTEX_API_KEY\`) atau kuota akun Google Cloud / Gemini API Anda.*`,
    toolCalls: []
  };
}

