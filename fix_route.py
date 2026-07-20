import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/app/api/analyze/route.ts', 'r') as f:
    content = f.read()

# 1. Update destructuring
content = content.replace(
    'const { image, apiKey: clientApiKey } = await req.json();',
    'const { image, detailImage, provenance, apiKey: clientApiKey } = await req.json();'
)

# 2. Update Prompt
prompt_old = """    const prompt = `Analiza la siguiente imagen de una mesa con varios objetos. La imagen tiene superpuesta una cuadrícula con letras (A, B, C...) en el eje X y números (1, 2, 3...) en el eje Y.
Tu tarea es identificar los objetos que más destaquen y que tengan un ALTO PROBABILIDAD DE SER ANTIGÜEDADES DE VALOR en el mercado de subastas. Encuentra el "Top 3".

ATENCIÓN 1: REGLA DE ORO: Si al analizar la imagen determinas que ABSOLUTAMENTE TODOS los objetos son chatarra, decoración moderna común, baratijas, imitaciones baratas o herramientas modernas sin valor de colección, DEBES DEVOLVER UNA LISTA VACÍA DE ITEMS: "items": []. NO DEVUELVAS OBJETOS SIN VALOR SOLO POR LLENAR LA LISTA. Si devuelves 0 items, es una respuesta perfectamente válida y correcta.
ATENCIÓN 2: Las coordenadas en 'gridArea' deben formar un rectángulo que CUBRA EL OBJETO COMPLETO de extremo a extremo.

Debes devolver EXACTAMENTE un objeto JSON (sin formato Markdown, sin texto adicional) con la siguiente estructura:
{
  "reasoning": "Analiza paso a paso qué objetos ves, dónde están, y si parecen antigüedades reales o simple decoración moderna barata. Decide si amerita agregar alguno a la lista de items.",
  "items": [
    {
      "itemName": "Nombre específico del objeto en Español",
      "itemNameEnglish": "Specific English translation of the item name",
      "description": "Una breve descripción en Español de lo que ves.",
      "authenticityMarkers": "ACTÚA CON EXTREMO ESCEPTICISMO. Si ves un sello, identifica de qué fábrica es. Menciona firmas, pátinas o métodos de ensamblaje históricos que prueben su valor.",
      "estimatedValue": "Rango de precio en dólares (ej: $500 - $1500 USD).",
      "gridArea": ["Coordenada Superior Izquierda", "Coordenada Inferior Derecha"],
      "gridCenter": "Coordenada exacta del centro del objeto"
    }
  ]
}

Ejemplo de coordenadas: gridArea: ["B2", "D4"], gridCenter: "C3".`;"""

prompt_new = """    const prompt = `Eres un tasador experto de antigüedades. Analiza la imagen principal (plano general con cuadrícula) y, si se proporciona, la segunda imagen de detalle (sello, firma, material).
La imagen principal tiene superpuesta una cuadrícula con letras (A, B, C...) en el eje X y números (1, 2, 3...) en el eje Y.
${provenance ? `\nCONTEXTO HISTÓRICO PROPORCIONADO POR EL CLIENTE: "${provenance}"\nUtiliza este contexto para afinar tu tasación.\n` : ""}
Tu tarea es identificar los objetos que más destaquen y que tengan un ALTA PROBABILIDAD DE SER ANTIGÜEDADES DE VALOR en el mercado de subastas. Encuentra el "Top 3".

ATENCIÓN 1: REGLA DE ORO: Si al analizar la imagen determinas que ABSOLUTAMENTE TODOS los objetos son chatarra, decoración moderna común, baratijas, imitaciones baratas o herramientas modernas sin valor de colección, DEBES DEVOLVER UNA LISTA VACÍA DE ITEMS: "items": []. NO DEVUELVAS OBJETOS SIN VALOR SOLO POR LLENAR LA LISTA. Si devuelves 0 items, es una respuesta perfectamente válida y correcta.
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
      "estimatedValue": "Rango de precio en dólares (ej: $500 - $1500 USD).",
      "gridArea": ["Coordenada Superior Izquierda", "Coordenada Inferior Derecha"],
      "gridCenter": "Coordenada exacta del centro del objeto"
    }
  ]
}

Ejemplo de coordenadas: gridArea: ["B2", "D4"], gridCenter: "C3".`;"""
content = content.replace(prompt_old, prompt_new)

# 3. Update API payload
api_payload_old = """        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],"""
api_payload_new = """        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
              ...(detailImage ? [{ type: "image_url", image_url: { url: detailImage } }] : [])
            ]
          }
        ],"""
content = content.replace(api_payload_old, api_payload_new)

# 4. Update Fallback
fallback_old = """           // Fallback en caso de que la IA ignore el prompt y mande el formato viejo
           result.items.push({
               itemName: result.itemName,
               itemNameEnglish: result.itemNameEnglish,
               description: result.description,
               authenticityMarkers: result.authenticityMarkers,
               estimatedValue: result.estimatedValue,
               gridArea: result.gridArea,
               gridCenter: result.gridCenter
           });"""
fallback_new = """           // Fallback en caso de que la IA ignore el prompt y mande el formato viejo
           result.items.push({
               itemName: result.itemName,
               itemNameEnglish: result.itemNameEnglish,
               description: result.description,
               materiales: result.materiales || "No especificado",
               epocaEstimada: result.epocaEstimada || "No especificado",
               estadoConservacion: result.estadoConservacion || "No especificado",
               authenticityMarkers: result.authenticityMarkers,
               estimatedValue: result.estimatedValue,
               gridArea: result.gridArea,
               gridCenter: result.gridCenter
           });"""
content = content.replace(fallback_old, fallback_new)

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/app/api/analyze/route.ts', 'w') as f:
    f.write(content)
