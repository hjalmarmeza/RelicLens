"use client";

import { useEffect, useState } from "react";
import { getAllRelics, deleteRelic, RelicRecord } from "@/lib/db";
import { getOverlayStylesForVault } from "@/components/ImageUploader";

export default function RelicVault() {
  const [relics, setRelics] = useState<RelicRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState<Record<string, boolean>>({});

  const loadRelics = async () => {
    try {
      const data = await getAllRelics();
      setRelics(data.sort((a, b) => b.timestamp - a.timestamp));
      const initialOverlays: Record<string, boolean> = {};
      data.forEach(r => initialOverlays[r.id] = true);
      setShowOverlay(initialOverlays);
    } catch (error) {
      console.error("Failed to load relics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de eliminar este registro de la bóveda?")) {
      await deleteRelic(id);
      setRelics(prev => prev.filter(r => r.id !== id));
    }
  };

  const toggleOverlay = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOverlay(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return <div className="vault-loading">Abriendo la Bóveda...</div>;
  }

  if (relics.length === 0) {
    return (
      <div className="empty-vault glass-panel">
        <div className="empty-icon">🏛️</div>
        <h2>La Bóveda está vacía</h2>
        <p>Aún no has descubierto ninguna reliquia. Ve a "Escanear" para empezar tu colección.</p>
      </div>
    );
  }

  return (
    <div className="vault-container">
      <div className="vault-grid">
        {relics.map(relic => {
          const isExpanded = expandedId === relic.id;
          const date = new Date(relic.timestamp).toLocaleString();
          
          // Compatibilidad: si es viejo, convertir a array
          const items = relic.result.items || [relic.result];

          return (
            <div 
              key={relic.id} 
              className={`glass-panel vault-card ${isExpanded ? 'expanded' : ''} animate-fade-in`}
              onClick={() => setExpandedId(isExpanded ? null : relic.id)}
            >
              <div className="card-image-container">
                <img src={relic.originalImage} alt={items[0]?.itemName} className="vault-image" />
                
                {showOverlay[relic.id] && (
                  <>
                    <div className="overlay-darken"></div>
                    {items.map((item: any, idx: number) => {
                      const overlay = getOverlayStylesForVault(item);
                      if (!overlay) return null;
                      const colors = ["#FFD700", "#00FF00", "#00FFFF"];
                      const color = colors[idx % colors.length];
                      return (
                        <div key={idx}>
                          <div className="highlight-area" style={{...overlay.area, backgroundColor: 'rgba(255, 215, 0, 0.1)'}}>
                             <div className="highlight-borders" style={{borderColor: color}}></div>
                          </div>
                          <div className="center-target" style={overlay.center}>
                             <div className="target-dot" style={{backgroundColor: color}}></div>
                             <div className="target-ring-static" style={{borderColor: color}}></div>
                             <div className="target-label" style={{
                                position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', 
                                background: 'rgba(0,0,0,0.7)', color: color, padding: '2px 6px', 
                                borderRadius: '4px', fontSize: '10px', whiteSpace: 'nowrap', fontWeight: 'bold'
                             }}>{idx + 1}</div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {isExpanded && (
                  <button 
                    className="toggle-overlay-btn" 
                    onClick={(e) => toggleOverlay(relic.id, e)}
                  >
                    {showOverlay[relic.id] ? "👁️ Ocultar Análisis" : "👁️ Mostrar Análisis"}
                  </button>
                )}
              </div>

              <div className="card-content">
                <div className="card-header">
                  <h3 className="vault-item-title">{items.length > 1 ? `Top ${items.length} Objetos Valiosos` : items[0]?.itemName}</h3>
                  <button className="delete-btn" onClick={(e) => handleDelete(relic.id, e)}>🗑️</button>
                </div>
                <p className="vault-date">{date}</p>
                <p className="vault-price">{items.length > 1 ? "Múltiples tasaciones" : (items[0]?.estimatedValue || "Valor por determinar")}</p>
                
                {isExpanded && (
                  <div className="expanded-details animate-fade-in-up">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} style={{ marginBottom: "1.5rem", borderBottom: idx < items.length - 1 ? "1px solid var(--border-color)" : "none", paddingBottom: "1.5rem" }}>
                        <h4 style={{ color: "var(--accent-light)", marginBottom: "0.5rem" }}>{idx + 1}. {item.itemName}</h4>
                        <p style={{ color: "#FFD700", fontWeight: "bold", marginBottom: "0.5rem" }}>{item.estimatedValue}</p>
                        <p className="vault-desc" style={{ marginBottom: "0.5rem" }}>{item.description}</p>
                        
                        {item.authenticityMarkers && (
                          <div className="authenticity-guide" style={{ 
                            background: "rgba(255, 215, 0, 0.05)", 
                            borderLeft: "3px solid #FFD700", 
                            padding: "0.8rem", 
                            borderRadius: "0 4px 4px 0",
                            marginBottom: "1rem" 
                          }}>
                            <h5 style={{ margin: "0 0 0.4rem 0", color: "#FFD700", fontSize: "0.9rem" }}>🔍 Guía de Autenticidad:</h5>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{item.authenticityMarkers}</p>
                          </div>
                        )}
                        
                        {item.marketData && item.marketData.length > 0 && (
                          <div className="vault-market">
                            <h5 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>Subastas Encontradas:</h5>
                            {item.marketData.map((data: any, linkIdx: number) => (
                              <a key={linkIdx} href={data.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="vault-market-link">
                                {data.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      
    </div>
  );
}
