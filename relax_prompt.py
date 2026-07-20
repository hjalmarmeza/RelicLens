import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/app/api/analyze/route.ts', 'r') as f:
    content = f.read()

prompt_old = """ATENCIÓN 1: REGLA DE ORO: Si al analizar la imagen determinas que ABSOLUTAMENTE TODOS los objetos son chatarra, decoración moderna común, baratijas, imitaciones baratas o herramientas modernas sin valor de colección, DEBES DEVOLVER UNA LISTA VACÍA DE ITEMS: "items": []. NO DEVUELVAS OBJETOS SIN VALOR SOLO POR LLENAR LA LISTA. Si devuelves 0 items, es una respuesta perfectamente válida y correcta."""

prompt_new = """ATENCIÓN 1: REGLA DE ORO: Si al analizar la imagen determinas que ABSOLUTAMENTE TODOS los objetos son chatarra moderna irrefutable (ej. cargadores de celular, botellas de plástico, herramientas modernas), devuelve "items": []. SIN EMBARGO, si ves objetos de arte, jarrones, cuadros, o platos de porcelana clásica (aunque no veas la marca), ASUME QUE PODRÍAN TENER VALOR e inclúyelos en tu análisis."""

content = content.replace(prompt_old, prompt_new)

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/app/api/analyze/route.ts', 'w') as f:
    f.write(content)

