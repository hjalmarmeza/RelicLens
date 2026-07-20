import { NextResponse } from "next/server";
import google from "googlethis";

export async function POST(req: Request) {
  try {
    const { image, apiKey: clientApiKey } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = clientApiKey || process.env.DEEPINFRA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Por favor, ingresa tu clave de DeepInfra en la aplicación." }, { status: 400 });
    }

    const prompt = `Analiza la siguiente imagen de una mesa con varios objetos. La imagen tiene superpuesta una cuadrícula con letras (A, B, C...) en el eje X y números (1, 2, 3...) en el eje Y.
Tu tarea es identificar los objetos que más destaquen. Encuentra el "Top 3". Si hay menos de 3 objetos, devuelve solo los que encuentres.

Para evitar errores, primero debes analizar los objetos que ves y sus posiciones en la cuadrícula antes de dar el resultado final.
ATENCIÓN 1: Si el objeto está dentro de un grupo de objetos muy juntos, DEBES ser extremadamente específico en tu campo "description" (ej: "La moneda de plata más grande en la esquina superior izquierda").
ATENCIÓN 2: Las coordenadas en 'gridArea' deben formar un rectángulo que CUBRA EL OBJETO COMPLETO de extremo a extremo, no solo el centro o una pequeña parte.

Debes devolver EXACTAMENTE un objeto JSON (sin formato Markdown, sin texto adicional) con la siguiente estructura:
{
  "reasoning": "Analiza paso a paso qué objetos ves, dónde están, y si parecen antigüedades reales o simple decoración moderna barata.",
  "items": [
    {
      "itemName": "Nombre específico del objeto en Español (ej: Figura de porcelana moderna)",
      "itemNameEnglish": "Specific English translation of the item name (e.g. Modern Porcelain Figurine)",
      "description": "Una breve descripción en Español de lo que ves.",
      "authenticityMarkers": "ACTÚA CON EXTREMO ESCEPTICISMO. Si parece producción masiva, decoración moderna o imitación barata, indícalo claramente. Si ves un sello, identifica de qué fábrica es. Sé técnico y profesional, pero NUNCA asumas que algo es valioso solo porque sí.",
      "estimatedValue": "REGLA DE ORO: Si es una decoración moderna, baratija o reproducción sin valor histórico, escribe EXACTAMENTE: 'Sin valor de subasta (Decoración común)'. SOLO asigna un rango en dólares (ej: $500 - $1500 USD) si estás ABSOLUTAMENTE SEGURO de que es una antigüedad genuina y codiciada.",
      "gridArea": ["Coordenada Superior Izquierda", "Coordenada Inferior Derecha"],
      "gridCenter": "Coordenada exacta del centro del objeto"
    }
  ]
}

Ejemplo de coordenadas: gridArea: ["B2", "D4"], gridCenter: "C3".`;

    console.log("Enviando petición a DeepInfra (Vision)...");
    const aiResponse = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("DeepInfra API error:", err);
      return NextResponse.json({ error: "Error contacting DeepInfra API" }, { status: 500 });
    }

    const data = await aiResponse.json();
    
    let result;
    try {
      const messageContent = data.choices[0].message.content;
      let jsonString = messageContent;
      if (jsonString.startsWith("\`\`\`json")) {
        jsonString = jsonString.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      } else if (jsonString.startsWith("\`\`\`")) {
        jsonString = jsonString.replace(/\`\`\`/g, "").trim();
      }
      result = JSON.parse(jsonString);
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse AI response as JSON" }, { status: 500 });
    }

    // Asegurarse de que `items` exista
    if (!result.items) {
       result.items = [];
       if (result.itemName) {
           // Fallback en caso de que la IA ignore el prompt y mande el formato viejo
           result.items.push({
               itemName: result.itemName,
               itemNameEnglish: result.itemNameEnglish,
               description: result.description,
               authenticityMarkers: result.authenticityMarkers,
               estimatedValue: result.estimatedValue,
               gridArea: result.gridArea,
               gridCenter: result.gridCenter
           });
       }
    }

    // Paso 2: Búsqueda paralela en Google para cada item
    const searchPromises = result.items.map(async (item: any) => {
      try {
        const searchTerm = item.itemNameEnglish || item.itemName;
        console.log(`Buscando precio en mercado real global para: ${searchTerm}`);
        let query = `${searchTerm} antique auction price`;
        let searchOptions = {
          page: 0, 
          safe: false, 
          parse_ads: false, 
          additional_params: { hl: 'en' }
        };
        
        let response = await google.search(query, searchOptions);
        
        // Estrategia de Fallback: Si no hay resultados estrictos, abrimos la búsqueda al máximo
        if (!response.results || response.results.length === 0) {
           console.log(`Búsqueda estricta fallida, intentando búsqueda amplia para: ${searchTerm}`);
           query = `${searchTerm} estimated value`;
           response = await google.search(query, searchOptions);
        }

        if (response.results && response.results.length > 0) {
          let marketData = response.results.slice(0, 3).map((res: any) => ({
            title: res.title,
            description: res.description,
            url: res.url
          }));

          // Paso 3: Traducción y Tasación Real
          const translationPrompt = `Eres un experto tasador de antigüedades. A continuación te presento los resultados reales de búsqueda del mercado (títulos y descripciones) para el objeto: "${item.itemName}".
          
1. Traduce los campos 'title' y 'description' al Español. No traduzcas las URLs.
2. Analiza los precios mencionados EXCLUSIVAMENTE en estos textos para extraer un rango de precio en USD.
3. BAJO NINGÚN MOTIVO DEBES INVENTAR O ADIVINAR EL PRECIO. Si no ves ningún precio escrito en los resultados de búsqueda, debes poner exactamente: "Requiere tasación manual".

Debes devolver EXACTAMENTE un objeto JSON con la siguiente estructura:
{
  "marketData": [
    { "title": "título en español", "description": "descripción en español", "url": "..." }
  ],
  "marketEstimatedValue": "Ej: $150 - $300 USD (Verificado) o 'Requiere tasación manual'"
}

Resultados de búsqueda originales:
${JSON.stringify(marketData)}`;
          
          const translateResponse = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: "meta-llama/Meta-Llama-3-8B-Instruct",
              messages: [{ role: "user", content: translationPrompt }],
              response_format: { type: "json_object" }
            })
          });

          if (translateResponse.ok) {
            const transData = await translateResponse.json();
            const transContent = transData.choices[0].message.content;
            let transJsonString = transContent;
            if (transJsonString.startsWith("\`\`\`json")) {
              transJsonString = transJsonString.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
            } else if (transJsonString.startsWith("\`\`\`")) {
              transJsonString = transJsonString.replace(/\`\`\`/g, "").trim();
            }
            const translatedObj = JSON.parse(transJsonString);
            
            if (translatedObj.marketData && Array.isArray(translatedObj.marketData)) {
              item.marketData = translatedObj.marketData;
              if (translatedObj.marketEstimatedValue && !translatedObj.marketEstimatedValue.includes("Requiere tasación manual")) {
                 item.estimatedValue = translatedObj.marketEstimatedValue + " (Verificado en mercado actual)";
              } else {
                 item.estimatedValue = item.estimatedValue + " (Tasación experta de IA - Subastas encontradas sin precios claros)";
              }
            } else if (Array.isArray(translatedObj)) {
              item.marketData = translatedObj;
              item.estimatedValue = item.estimatedValue + " (Tasación experta de IA)";
            } else {
               const potentialArray = Object.values(translatedObj).find(val => Array.isArray(val));
               if (potentialArray) item.marketData = potentialArray;
               item.estimatedValue = item.estimatedValue + " (Tasación experta de IA)";
            }
          } else {
            item.estimatedValue = item.estimatedValue + " (Tasación experta de IA - Fallo al traducir subastas)";
          }
        } else {
          item.estimatedValue = item.estimatedValue + " (Tasación experta de IA - No se encontraron subastas online en este momento)";
        }
      } catch (e) {
        console.error(`Error procesando mercado para ${item.itemName}:`, e);
        item.estimatedValue = item.estimatedValue + " (Tasación experta de IA - Bloqueo de conexión al mercado)";
      }
      return item;
    });

    await Promise.all(searchPromises);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
