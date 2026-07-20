import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'r') as f:
    content = f.read()

# Add hallmarkAnalysis badge to the card
card_old = """                  {item.estadoConservacion && (
                     <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🛠 Estado de Conservación</span>
                        <strong>{item.estadoConservacion}</strong>
                     </div>
                  )}

                  <p className="result-desc" style={{ marginBottom: "1rem", lineHeight: '1.5' }}>{item.description}</p>"""

card_new = """                  {item.estadoConservacion && (
                     <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🛠 Estado de Conservación</span>
                        <strong>{item.estadoConservacion}</strong>
                     </div>
                  )}
                  
                  {item.hallmarkAnalysis && item.hallmarkAnalysis !== "No analizado" && !item.hallmarkAnalysis.includes("No se analizó detalle") && (
                     <div style={{ background: 'linear-gradient(to right, rgba(138, 43, 226, 0.1), rgba(0, 0, 0, 0))', borderLeft: '4px solid #8A2BE2', padding: '0.8rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        <span style={{ color: '#8A2BE2', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                           🔍 Escáner OCR de Firmas y Sellos
                        </span>
                        <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{item.hallmarkAnalysis}</span>
                     </div>
                  )}

                  <p className="result-desc" style={{ marginBottom: "1rem", lineHeight: '1.5' }}>{item.description}</p>"""

content = content.replace(card_old, card_new)

# Add hallmarkAnalysis to PDF Export
pdf_old = """    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitCond = doc.splitTextToSize(item.estadoConservacion || "No evaluado", 170);
    doc.text(splitCond, 20, yPos);
    yPos += (splitCond.length * 5) + 10;"""

pdf_new = """    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitCond = doc.splitTextToSize(item.estadoConservacion || "No evaluado", 170);
    doc.text(splitCond, 20, yPos);
    yPos += (splitCond.length * 5) + 10;
    
    if (item.hallmarkAnalysis && item.hallmarkAnalysis !== "No analizado" && !item.hallmarkAnalysis.includes("No se analizó detalle")) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(138, 43, 226); // Purple for OCR
        doc.text("ESCÁNER OCR (FIRMASC Y SELLOS)", 20, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(0, 0, 0);
        const splitHallmark = doc.splitTextToSize(item.hallmarkAnalysis, 170);
        doc.text(splitHallmark, 20, yPos);
        yPos += (splitHallmark.length * 5) + 10;
    }"""

content = content.replace(pdf_old, pdf_new)

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'w') as f:
    f.write(content)

