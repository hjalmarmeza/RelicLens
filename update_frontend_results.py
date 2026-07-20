import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'r') as f:
    content = f.read()

card_old = """                  <p className="result-value" style={{ fontSize: "1.2rem", color: "#FFD700", margin: "0.5rem 0" }}>
                    Valor Estimado: <strong>{item.estimatedValue || "Buscando referencias..."}</strong>
                  </p>
                  <p className="result-desc" style={{ marginBottom: "0.5rem" }}>{item.description}</p>
                        
                  {item.authenticityMarkers && ("""

card_new = """                  <p className="result-value" style={{ fontSize: "1.2rem", color: "#FFD700", margin: "0.5rem 0" }}>
                    Valor Estimado: <strong>{item.estimatedValue || "Buscando referencias..."}</strong>
                  </p>

                  <div className="expert-badges" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                     {item.epocaEstimada && (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                           <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>⏳ Época</span>
                           <strong>{item.epocaEstimada}</strong>
                        </div>
                     )}
                     {item.materiales && (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                           <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🏺 Materiales</span>
                           <strong>{item.materiales}</strong>
                        </div>
                     )}
                  </div>
                  
                  {item.estadoConservacion && (
                     <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🛠 Estado de Conservación</span>
                        <strong>{item.estadoConservacion}</strong>
                     </div>
                  )}

                  <p className="result-desc" style={{ marginBottom: "1rem", lineHeight: '1.5' }}>{item.description}</p>
                        
                  {item.authenticityMarkers && ("""

content = content.replace(card_old, card_new)

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'w') as f:
    f.write(content)
