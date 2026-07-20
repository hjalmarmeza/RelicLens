import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/app/api/analyze/route.ts', 'r') as f:
    content = f.read()

# Step 1 & 2: Modify Vision API call (temperature and prompt)
vision_prompt_old = """  - "itemNameEnglish": Nombre descriptivo EN INGLÉS (para búsqueda en mercado global)."""
vision_prompt_new = """  - "itemNameEnglish": Nombre hiper-descriptivo EN INGLÉS. OBLIGATORIO: Debes incluir la marca, fabricante, firma, material y época (ej. "Meissen 19th Century crossed swords blue and white porcelain plate"). Esto es CRÍTICO para la búsqueda SEO."""

content = content.replace(vision_prompt_old, vision_prompt_new)

vision_api_old = """        response_format: { type: "json_object" }
      })"""
vision_api_new = """        response_format: { type: "json_object" },
        temperature: 0.1
      })"""

content = content.replace(vision_api_old, vision_api_new)

# Step 3: Modify Translation/Appraisal API call (temperature and prompt)
trans_prompt_old = """2. Analiza los precios mencionados EXCLUSIVAMENTE en estos textos para extraer un rango de precio en USD.
3. BAJO NINGÚN MOTIVO DEBES INVENTAR O ADIVINAR EL PRECIO. Si no ves ningún precio escrito en los resultados de búsqueda, debes poner exactamente: "Requiere tasación manual".

Debes devolver EXACTAMENTE un objeto JSON con la siguiente estructura:
{
  "marketData": [
    { "title": "título en español", "description": "descripción en español", "url": "..." }
  ],
  "marketEstimatedValue": "Ej: $150 - $300 USD (Verificado) o 'Requiere tasación manual'"
}"""

trans_prompt_new = """2. Analiza los precios mencionados EXCLUSIVAMENTE en estos textos para extraer un rango de precio en USD.
3. Si los resultados de búsqueda no contienen precios claros o son resultados basura, OBLIGATORIAMENTE debes calcular una "Estimación Teórica Experta" basándote en el prestigio de la marca, el material y la antigüedad del objeto descrito.
4. Si extraes el precio de los textos, escribe: "$X - $Y USD (Verificado en mercado actual)". Si tienes que calcularlo tú teóricamente porque no hay precios, escribe: "$X - $Y USD (Estimación teórica de IA basada en análisis de época y técnica)".

Debes devolver EXACTAMENTE un objeto JSON con la siguiente estructura:
{
  "marketData": [
    { "title": "título en español", "description": "descripción en español", "url": "..." }
  ],
  "marketEstimatedValue": "Ej: $150 - $300 USD (Verificado en mercado actual) o $200 - $450 USD (Estimación teórica de IA basada en análisis de época y técnica)"
}"""

content = content.replace(trans_prompt_old, trans_prompt_new)

trans_api_old = """              response_format: { type: "json_object" }
            })"""
trans_api_new = """              response_format: { type: "json_object" },
              temperature: 0.1
            })"""

content = content.replace(trans_api_old, trans_api_new)

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/app/api/analyze/route.ts', 'w') as f:
    f.write(content)

