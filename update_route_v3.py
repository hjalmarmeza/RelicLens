import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/app/api/analyze/route.ts', 'r') as f:
    content = f.read()

# 1. Update Prompt
prompt_old = """      "estadoConservacion": "Evalúa el estado visible (ej. 'Presenta pátina original, buen estado', 'Desgaste severo, posibles grietas').",
      "authenticityMarkers": "ACTÚA CON EXTREMO ESCEPTICISMO. Identifica firmas, marcas, ensamblajes históricos. Justifica su autenticidad.",
      "estimatedValue": "Rango de precio en dólares (ej: $500 - $1500 USD).","""

prompt_new = """      "estadoConservacion": "Evalúa el estado visible (ej. 'Presenta pátina original, buen estado', 'Desgaste severo, posibles grietas').",
      "authenticityMarkers": "ACTÚA CON EXTREMO ESCEPTICISMO. Identifica firmas, marcas, ensamblajes históricos. Justifica su autenticidad.",
      "hallmarkAnalysis": "Si hay foto de detalle, actúa como ESCÁNER OCR experto. Extrae TODAS las letras, firmas, números o sellos y crúzalos con bases de datos históricas (ej: sellos de plata, marcas de porcelana). Si no hay foto de detalle, pon 'No se analizó detalle'.",
      "estimatedValue": "Rango de precio en dólares (ej: $500 - $1500 USD).","""

content = content.replace(prompt_old, prompt_new)

# Update Fallback in prompt parsing
fallback_old = """               estadoConservacion: result.estadoConservacion || "No especificado",
               authenticityMarkers: result.authenticityMarkers,
               estimatedValue: result.estimatedValue,"""

fallback_new = """               estadoConservacion: result.estadoConservacion || "No especificado",
               authenticityMarkers: result.authenticityMarkers,
               hallmarkAnalysis: result.hallmarkAnalysis || "No analizado",
               estimatedValue: result.estimatedValue,"""

content = content.replace(fallback_old, fallback_new)

# 2. Update Google Search logic
search_old = """        let query = `${searchTerm} antique auction price`;
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
        }"""

search_new = """        let query = `${searchTerm} antique auction price`;
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
        }"""

content = content.replace(search_old, search_new)

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/app/api/analyze/route.ts', 'w') as f:
    f.write(content)

