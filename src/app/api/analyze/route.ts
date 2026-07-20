import { NextResponse } from "next/server";
import google from "googlethis";

export async function POST(req: Request) {
  try {
    const { image, detailImage, provenance, apiKey: clientApiKey } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = clientApiKey || process.env.DEEPINFRA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Por favor, ingresa tu clave de DeepInfra en la aplicación." }, { status: 400 });
    }

    const prompt = `Eres un tasador experto de antigüedades. Analiza la imagen principal (plano general con cuadrícula) y, si se proporciona, la segunda imagen de detalle (sello, firma, material).
La imagen principal tiene superpuesta una cuadrícula con letras (A, B, C...) en el eje X y números (1, 2, 3...) en el eje Y.
${provenance ? `
CONTEXTO HISTÓRICO PROPORCIONADO POR EL CLIENTE: "${provenance}"
Utiliza este contexto para afinar tu tasación.
` : ""}
Tu tarea es identificar los objetos que más destaquen y que tengan un ALTA PROBABILIDAD DE SER ANTIGÜEDADES DE VALOR en el mercado de subastas. Encuentra el "Top 3".

ATENCIÓN 1: REGLA DE ORO: Si al analizar la imagen determinas que ABSOLUTAMENTE TODOS los objetos son chatarra moderna irrefutable (ej. cargadores de celular, botellas de plástico, herramientas modernas), devuelve "items": []. SIN EMBARGO, si ves objetos de arte, jarrones, cuadros, o platos de porcelana clásica (aunque no veas la marca), ASUME QUE PODRÍAN TENER VALOR e inclúyelos en tu análisis.
ATENCIÓN 2: Las coordenadas en 'gridArea' deben formar un rectángulo que CUBRA EL OBJETO COMPLETO de extremo a extremo en la imagen principal.

Debes devolver EXACTAMENTE un objeto JSON (sin formato Markdown, sin texto adicional) con la siguiente estructura:
{
  "reasoning": "Analiza paso a paso qué objetos ves, evalúa las fotos de detalle (si las hay) y el contexto histórico. Decide si amerita agregar alguno a la lista de items.",
  "items": [
    {
      "itemName": "Nombre específico del objeto en Español",
      "itemNameEnglish": "Specific English translation of the item name",
      "description": "Una breve descripción en Español de lo que ves.",
      "materiales": "Describe los materiales detectados (ej. 'Bronce a la cera perdida', 'Plata 925', 'Madera maciza de caoba').",
      "epocaEstimada": "Estima la época o año (ej. 'Art Déco, circa 1920', 'Reproducción moderna 2010').",
      "estadoConservacion": "Evalúa el estado visible (ej. 'Presenta pátina original, buen estado', 'Desgaste severo, posibles grietas').",
      "authenticityMarkers": "ACTÚA CON EXTREMO ESCEPTICISMO. Identifica firmas, marcas, ensamblajes históricos. Justifica su autenticidad.",
      "hallmarkAnalysis": "Si hay foto de detalle, actúa como ESCÁNER OCR experto. Extrae TODAS las letras, firmas, números o sellos y crúzalos con bases de datos históricas (ej: sellos de plata, marcas de porcelana). Si no hay foto de detalle, pon 'No se analizó detalle'.",
      "estimatedValue": "Rango de precio en dólares (ej: $500 - $1500 USD).",
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
              { type: "image_url", image_url: { url: image } },
              ...(detailImage ? [{ type: "image_url", image_url: { url: detailImage } }] : [])
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
               materiales: result.materiales || "No especificado",
               epocaEstimada: result.epocaEstimada || "No especificado",
               estadoConservacion: result.estadoConservacion || "No especificado",
               authenticityMarkers: result.authenticityMarkers,
               hallmarkAnalysis: result.hallmarkAnalysis || "No analizado",
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
        
        let response;
        
        // RELICLENS 3.0: Reverse Image Search si hay foto de detalle
        if (detailImage) {
           console.log(`Ejecutando Búsqueda Visual Inversa de Google para: ${searchTerm}`);
           try {
              const base64Data = detailImage.split(',')[1];
              const buffer = Buffer.from(base64Data, 'base64');
              response = await google.search(buffer, { ris: true });
           } catch(e) {
              console.log("Fallo Búsqueda Visual Inversa, usando texto fallback");
              response = await google.search(query, searchOptions);
           }
        } else {
           response = await google.search(query, searchOptions);
        }
        
        // Estrategia de Fallback: Si no hay resultados visuales ni estrictos, abrimos la búsqueda al máximo
        if (!response || !response.results || response.results.length === 0) {
           console.log(`Búsqueda inicial fallida, intentando búsqueda amplia de texto para: ${searchTerm}`);
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
