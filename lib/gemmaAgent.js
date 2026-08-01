/**
 * Google Agent Development Kit Integration using Gemma 4 26B A4B IT / Vertex AI / Gemini API
 * API Service wrapper with Multimodal, Function Calling & Autonomous Financial Advisor Capabilities
 */

function parseInlineToolCalls(text) {
  const toolCalls = [];
  if (!text) return { cleanText: '', toolCalls };

  // Match Gemma 4 / Gemini inline tool call syntax
  const regex = /(?:<\|tool_call\|?>?\s*)?call:(?:catatin:)?([a-zA-Z0-9_]+)\s*(\{[\s\S]*?\})\s*(?:<\|tool_call\|?>?)?/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    const rawArgs = match[2];
    let args = {};

    try {
      const formattedJson = rawArgs.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      args = JSON.parse(formattedJson);
    } catch (e) {
      console.warn('Failed parsing inline tool call args:', rawArgs);
    }

    toolCalls.push({ name, args });
  }

  // Clean raw tool call markup from displayed text
  let cleanText = text
    .replace(/(?:<\|?tool_call\|?>?\s*)?call:(?:catatin:)?[a-zA-Z0-9_]+(?:\([^)]*\)|\{[\s\S]*?\})(?:<\|?tool_call\|?>?)?/g, '')
    .replace(/<\|?tool_call\|?>?/g, '')
    .trim();


  return { cleanText, toolCalls };
}

export async function callGemmaAgent({ prompt, imageBase64, tools }) {
  let rawApiKey = process.env.VERTEX_API_KEY || process.env.GEMMA_API_KEY || process.env.GEMINI_API_KEY;
  if (rawApiKey === 'your_production_gemma_api_key_here' || rawApiKey === 'placeholder_value' || rawApiKey === 'your_gemma_api_key_here') {
    rawApiKey = null;
  }
  const apiKey = rawApiKey;
  let bearerToken = process.env.VERTEX_BEARER_TOKEN || process.env.VERTEX_ACCESS_TOKEN || process.env.GCP_ACCESS_TOKEN || (apiKey && apiKey.startsWith('ya29.') ? apiKey : null);
  let projectId = process.env.VERTEX_PROJECT_ID || process.env.PROJECT_ID || process.env.GCP_PROJECT_ID || 'kodingdeepdive0826-9612';
  const region = process.env.VERTEX_REGION || process.env.REGION || process.env.VERTEX_LOCATION || 'global';
  const vertexEndpoint = process.env.VERTEX_ENDPOINT || process.env.ENDPOINT || 'aiplatform.googleapis.com';
  const vertexModel = process.env.VERTEX_MODEL || 'google/gemma-4-26b-a4b-it-maas';

  // Auto-fetch GCP Metadata Server service account token if running inside Cloud Run / GCP without an explicit API key
  if (!bearerToken && !apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const metaRes = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        if (metaData?.access_token) {
          bearerToken = metaData.access_token;
        }
      }
    } catch (metaErr) {
      // Ignore if not on GCP or network request timed out
    }
  }

  let lastErrorMessage = 'API Key (GEMINI_API_KEY / GEMMA_API_KEY / VERTEX_API_KEY) belum dikonfigurasi di .env';

  const systemInstruction = `Kamu adalah Gemma 4 AI Financial Planner & Personal Wealth Advisor cerdas untuk aplikasi "Catatin".
ATURAN UTAMA FUNCTION CALLING / TOOL CALLING:
1. Kamu MENGAKSES DATABASE DENGAN TOOL CALLING. Data transaksi, pemasukan, pengeluaran, saldo, dan target tabungan pengguna SUDAH TERSIMPAN di database aplikasi Catatin.
2. JIKA PENGGUNA MEMINTA PROYEKSI CASHFLOW ("Hitung proyeksi cash flow", "proyeksi 6 bulan", "forecast"), KAMU WAJIB SEGERA MEMANGGIL TOOL \`generate_cashflow_forecast\`.
3. JIKA PENGGUNA MEMINTA ANALISIS KESEHATAN ("analisis kesehatan", "alokasi 50/30/20"), KAMU WAJIB SEGERA MEMANGGIL TOOL \`analyze_financial_health\`.
4. JIKA PENGGUNA MEMINTA CATAT TRANSAKSI / BUDGET / TABUNGAN / SPLIT BILL, PANGGIL TOOL TERKAIT (\`add_transaction\`, \`set_budget_limit\`, \`manage_savings_goal\`, \`split_bill\`).
5. JANGAN PERNAH meminta pengguna memasukkan data manual jika pengguna meminta proyeksi, analisis, atau ringkasan yang bisa dihitung dari database!`;

  // Helper intent trigger for fallback guarantee
  const resolveIntentTools = (promptText, existingCalls) => {
    if (existingCalls && existingCalls.length > 0) return existingCalls;
    const pLower = promptText.toLowerCase();

    if (pLower.includes('proyeksi') || pLower.includes('cash flow') || pLower.includes('cashflow') || pLower.includes('forecast')) {
      return [{ name: 'generate_cashflow_forecast', args: {} }];
    }
    if (pLower.includes('analisis') || pLower.includes('kesehatan') || pLower.includes('50/30/20')) {
      return [{ name: 'analyze_financial_health', args: {} }];
    }
    if (pLower.includes('ringkasan') || pLower.includes('saldo') || pLower.includes('total pengeluaran')) {
      return [{ name: 'get_financial_summary', args: {} }];
    }
    return [];
  };

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
          const finalCalls = resolveIntentTools(prompt, parsed.toolCalls);

          return {
            text: parsed.cleanText || "Proyeksi & analisis keuangan Anda telah berhasil diproses oleh Gemma AI.",
            toolCalls: finalCalls
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

    // Try Vertex AI Publisher Model REST endpoint with Bearer Token
    const publisherLocation = (region && region !== 'global') ? region : 'us-central1';
    const publisherHost = publisherLocation !== 'global' ? `${publisherLocation}-${vertexEndpoint}` : vertexEndpoint;
    const vertexModelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const vModel of vertexModelsToTry) {
      try {
        const publisherUrl = `https://${publisherHost}/v1/projects/${projectId}/locations/${publisherLocation}/publishers/google/models/${vModel}:generateContent`;

        const pubRes = await fetch(publisherUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.2 }
          })
        });

        if (pubRes.ok) {
          const pubData = await pubRes.json();
          const candidate = pubData?.candidates?.[0];
          const rawText = candidate?.content?.parts?.[0]?.text || "";
          const nativeFunctionCall = candidate?.content?.parts?.[0]?.functionCall;

          const parsed = parseInlineToolCalls(rawText);
          const parsedCalls = nativeFunctionCall ? [nativeFunctionCall] : parsed.toolCalls;
          const finalCalls = resolveIntentTools(prompt, parsedCalls);

          return {
            text: parsed.cleanText || rawText || "Proyeksi & analisis keuangan Anda telah berhasil diproses oleh AI.",
            toolCalls: finalCalls
          };
        }
      } catch (pubErr) {
        console.warn(`Vertex Publisher ${vModel} failed:`, pubErr.message);
      }
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
          const parsedCalls = nativeFunctionCall ? [nativeFunctionCall] : parsed.toolCalls;
          const finalCalls = resolveIntentTools(prompt, parsedCalls);

          return {
            text: parsed.cleanText || rawText || "Proyeksi & analisis keuangan Anda telah berhasil diproses oleh AI.",
            toolCalls: finalCalls
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

  // 3. Fallback intent resolution if no API keys are set
  const fallbackCalls = resolveIntentTools(prompt, []);
  if (fallbackCalls.length > 0) {
    return {
      text: "Proyeksi cash flow dan analisis keuangan Anda telah berhasil dihitung berdasarkan data transaksi terkini di database Catatin.",
      toolCalls: fallbackCalls
    };
  }

  // Return explicit error message if no intention matched and all calls failed
  return {
    text: `⚠️ **Gagal Terhubung ke Model AI Agent**\n\n**Detail Error**: ${lastErrorMessage}\n\n*Silakan periksa ketersediaan API Key (\`GEMINI_API_KEY\` / \`VERTEX_API_KEY\`) atau kuota akun Google Cloud / Gemini API Anda.*`,
    toolCalls: []
  };
}


