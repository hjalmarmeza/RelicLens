"use client";

import { useState, useRef, useEffect } from "react";
import { saveRelic } from "@/lib/db";

export const LETTERS = "ABCDEFGHIJ";

export const getOverlayStylesForVault = (result: any) => {
  if (!result || !result.gridArea || !result.gridCenter) return null;
  try {
    const [start, end] = result.gridArea;
    const parseCoord = (coord: string) => {
      const x = LETTERS.indexOf(coord.charAt(0).toUpperCase());
      const y = parseInt(coord.substring(1)) - 1;
      return { x, y };
    };

    const pStart = parseCoord(start);
    const pEnd = parseCoord(end);
    const pCenter = parseCoord(result.gridCenter);

    const left = pStart.x * 10;
    const top = pStart.y * 10;
    const width = (pEnd.x - pStart.x + 1) * 10;
    const height = (pEnd.y - pStart.y + 1) * 10;

    const centerLeft = pCenter.x * 10 + 5;
    const centerTop = pCenter.y * 10 + 5;

    return {
      area: { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` },
      center: { left: `${centerLeft}%`, top: `${centerTop}%` }
    };
  } catch (e) {
    return null;
  }
};


export default function ImageUploader() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const GRID_SIZE = 10;

  // Cargar clave guardada al iniciar
  useEffect(() => {
    const savedKey = localStorage.getItem("deepinfra_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem("deepinfra_key", val);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cellW = width / GRID_SIZE;
    const cellH = height / GRID_SIZE;

    for (let i = 0; i <= GRID_SIZE; i++) {
      const x = i * cellW;
      const y = i * cellH;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Labels
    for (let i = 0; i < GRID_SIZE; i++) {
      // Top row letters (X axis)
      ctx.fillText(LETTERS[i], i * cellW + cellW / 2, 20);
      // Left column numbers (Y axis)
      ctx.fillText((i + 1).toString(), 20, i * cellH + cellH / 2);
    }
  };

  const processImage = (file: File): Promise<{ original: string, gridded: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        
        // Scale down to max 1000px to save bandwidth
        const MAX_DIM = 1000;
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = (MAX_DIM / w) * h;
            w = MAX_DIM;
          } else {
            w = (MAX_DIM / h) * w;
            h = MAX_DIM;
          }
        }
        
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        
        const original = canvas.toDataURL("image/jpeg", 0.8);
        
        // Draw grid for AI
        drawGrid(ctx, w, h);
        const gridded = canvas.toDataURL("image/jpeg", 0.8);
        
        resolve({ original, gridded });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!apiKey) {
      alert("Por favor configura tu clave API primero en la esquina superior derecha.");
      setShowSettings(true);
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setLoadingStep(1); // "Analizando objetos..."

    try {
      const { original, gridded } = await processImage(file);
      setOriginalImage(original);

      // Simulamos pasos de carga para UI premium
      setTimeout(() => setLoadingStep(2), 3000); // "Buscando en bases de subastas..."
      setTimeout(() => setLoadingStep(3), 6000); // "Calculando valor de mercado..."

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: gridded, apiKey }),
      });
      
      const data = await response.json();
      
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image");
      }
      
      setResult(data);
      // Guardar en la base de datos local
      await saveRelic(original, data);
    } catch (error: any) {
      console.error(error);
      setResult({ error: error.message });
    } finally {
      setIsAnalyzing(false);
      setLoadingStep(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const overlay = getOverlayStylesForVault(result);

  return (
    <div className="uploader-container">
      <div className="header-actions">
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          ⚙️ Configuración API
        </button>
      </div>

      {showSettings && (
        <div className="modal-overlay">
          <div className="api-key-container glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>Configuración</h3>
              <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <label htmlFor="apiKeyInput" className="api-key-label">Tu Clave API de DeepInfra:</label>
            <input 
              id="apiKeyInput"
              type="password" 
              value={apiKey} 
              onChange={handleKeyChange} 
              placeholder="Pega tu clave secreta aquí..." 
              className="api-key-input"
            />
            <p className="api-key-help">Se guarda de forma segura en tu navegador local.</p>
            <button className="btn-primary mt-4" onClick={() => setShowSettings(false)}>
              Guardar y Cerrar
            </button>
          </div>
        </div>
      )}

      {!originalImage ? (
        <div 
          className="glass-panel upload-box animate-fade-in"
          onClick={triggerFileInput}
        >
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden-input"
          />
          <div className="upload-icon">📸</div>
          <h3>Sube la foto de la mesa</h3>
          <p>La IA identificará la pieza más valiosa del lote</p>
          <button className="btn-primary mt-4">Seleccionar Foto</button>
        </div>
      ) : (
        <div className="glass-panel result-box animate-fade-in">
          <div className="image-preview-container">
            <img src={originalImage} alt="Uploaded" className="preview-image" />
            
            {!isAnalyzing && result?.items && (
              <>
                <div className="overlay-darken"></div>
                {result.items.map((item: any, idx: number) => {
                  const overlay = getOverlayStylesForVault(item);
                  if (!overlay) return null;
                  // Colores ligeramente distintos para diferenciar
                  const colors = ["#FFD700", "#00FF00", "#00FFFF"];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={idx}>
                      <div className="highlight-area" style={{...overlay.area, backgroundColor: 'rgba(255, 215, 0, 0.1)'}}>
                         <div className="highlight-borders" style={{borderColor: color}}></div>
                      </div>
                      <div className="center-target" style={overlay.center}>
                         <div className="target-dot" style={{backgroundColor: color}}></div>
                         <div className="target-ring animate-pulse-ring" style={{borderColor: color}}></div>
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

            {isAnalyzing && (
              <div className="analyzing-overlay">
                <div className="spinner"></div>
                <div className="loading-text">
                  {loadingStep === 1 && "Analizando la escena..."}
                  {loadingStep === 2 && "Consultando casas de subastas..."}
                  {loadingStep === 3 && "Calculando valor de mercado..."}
                </div>
              </div>
            )}
          </div>

          {!isAnalyzing && result && !result.error && result.items && result.items.length > 0 && (
            <div className="analysis-result-list animate-fade-in" style={{ marginTop: '2rem' }}>
              <h2 className="result-title" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                🌟 Top {result.items.length} Objetos Valiosos Detectados
              </h2>
              
              {result.items.map((item: any, itemIndex: number) => (
                <div key={itemIndex} className="analysis-result" style={{ marginBottom: "2rem", borderTop: itemIndex > 0 ? "1px solid var(--border-color)" : "none", paddingTop: itemIndex > 0 ? "2rem" : "0" }}>
                  <h3 className="result-title" style={{ fontSize: "1.5rem", marginTop: 0 }}>
                    {itemIndex + 1}. {item.itemName}
                  </h3>
                  <p className="result-value" style={{ fontSize: "1.2rem", color: "#FFD700", margin: "0.5rem 0" }}>
                    Valor Estimado: <strong>{item.estimatedValue || "Buscando referencias..."}</strong>
                  </p>
                  <p className="result-desc" style={{ marginBottom: "0.5rem" }}>{item.description}</p>
                        
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
                  
                  {item.marketData && item.marketData.length > 0 ? (
                    <div className="market-data-section">
                      <h4 className="market-title">📊 Mercado Real (Casas de Subastas)</h4>
                      <div className="market-cards">
                        {item.marketData.map((data: any, idx: number) => (
                          <a key={idx} href={data.url} target="_blank" rel="noopener noreferrer" className="market-card">
                            <h5>{data.title}</h5>
                            <p>{data.description}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="market-data-section">
                      <p style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "0.9rem" }}>
                        ℹ️ No se encontraron enlaces directos a subastas en este momento, pero el valor de tasación base es el indicado arriba.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isAnalyzing && result?.error && (
            <div className="error-box animate-fade-in">
              <p>❌ Error: {result.error}</p>
            </div>
          )}

          {!isAnalyzing && (
            <button className="btn-secondary mt-4 w-full" onClick={() => setOriginalImage(null)}>
              Analizar otra foto
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .uploader-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          position: relative;
        }
        .header-actions {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }
        .settings-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all var(--transition-fast);
        }
        .settings-btn:hover {
          color: var(--text-primary);
          border-color: var(--glass-border);
          background: rgba(255, 255, 255, 0.05);
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }
        .api-key-container {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          max-width: 400px;
        }
        .modal-header {
          display: flex; justify-content: space-between; margin-bottom: 1rem;
        }
        .modal-header h3 { margin: 0; color: var(--accent-light); }
        .close-btn { background: none; border: none; color: white; cursor: pointer; }
        .api-key-input {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          padding: 0.8rem 1rem;
          border-radius: var(--border-radius-sm);
        }
        .upload-box {
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          border: 2px dashed var(--border-color);
          transition: all var(--transition-fast);
        }
        .upload-box:hover {
          border-color: var(--accent-main);
          transform: translateY(-2px);
        }
        .hidden-input { display: none; }
        .upload-icon { font-size: 3rem; margin-bottom: 1rem; }
        
        .result-box {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .image-preview-container {
          position: relative;
          width: 100%;
          border-radius: var(--border-radius-md);
          overflow: hidden;
          background: #000;
        }
        .preview-image {
          width: 100%;
          display: block;
        }
        .overlay-darken {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          pointer-events: none;
        }
        .highlight-area {
          position: absolute;
          background: rgba(255, 215, 0, 0.2); /* Gold tint */
          backdrop-filter: brightness(1.5);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          pointer-events: none;
        }
        .highlight-borders {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border: 2px solid #FFD700;
        }
        .center-target {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .target-dot {
          width: 10px; height: 10px;
          background: #FF0000;
          border-radius: 50%;
          box-shadow: 0 0 10px red;
        }
        .target-ring {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 30px; height: 30px;
          border: 2px solid red;
          border-radius: 50%;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }

        .analyzing-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }
        .spinner {
          width: 40px; height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--accent-main);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text {
          color: var(--accent-light);
          font-weight: 600;
          animation: pulse 1.5s infinite;
        }

        .analysis-result {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .result-title {
          font-size: 1.5rem;
          color: var(--accent-light);
          margin: 0;
        }
        .result-desc { color: var(--text-secondary); line-height: 1.6; }
        
        .market-data-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        .market-title {
          font-size: 1.1rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        .market-cards {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .market-card {
          padding: 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: var(--border-radius-sm);
          text-decoration: none;
          transition: all 0.2s;
        }
        .market-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: var(--accent-main);
        }
        .market-card h4 {
          margin: 0 0 0.5rem 0;
          color: var(--accent-light);
          font-size: 0.95rem;
        }
        .market-card p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .error-box {
          padding: 1rem;
          border-left: 4px solid #ef4444;
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
        }
        .w-full { width: 100%; }
        .mt-4 { margin-top: 1rem; }
      `}</style>
    </div>
  );
}
