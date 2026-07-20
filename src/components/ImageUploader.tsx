"use client";

import { useState, useRef, useEffect } from "react";
import { saveRelic } from "@/lib/db";
import jsPDF from "jspdf";

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
  const [griddedImage, setGriddedImage] = useState<string | null>(null);
  const [detailImage, setDetailImage] = useState<string | null>(null);
  const [provenanceText, setProvenanceText] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);

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
    if (e.target) e.target.value = '';
    if (!file) return;

    if (!apiKey) {
      alert("Por favor configura tu clave API primero en la esquina superior derecha.");
      setShowSettings(true);
      return;
    }

    setResult(null);
    try {
      const { original, gridded } = await processImage(file);
      setOriginalImage(original);
      setGriddedImage(gridded);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDetailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    
    // Procesar sin grid, solo achicar
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const MAX_DIM = 1000;
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
            if (w > h) { h = (MAX_DIM / w) * h; w = MAX_DIM; } 
            else { w = (MAX_DIM / h) * w; h = MAX_DIM; }
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        setDetailImage(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setLoadingStep(1);

    try {
      setTimeout(() => setLoadingStep(2), 3000);
      setTimeout(() => setLoadingStep(3), 6000);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: griddedImage, detailImage, provenance: provenanceText, apiKey }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyze image");
      
      setResult(data);
      await saveRelic(originalImage!, data);
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


  const generatePDF = (item: any, imageUrl: string, detailImg?: string | null) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(25, 25, 25);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 215, 0); // Gold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("RELICLENS", 105, 25, { align: "center" });
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("CERTIFICADO OFICIAL DE TASACIÓN IA", 105, 32, { align: "center" });

    // Item Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const splitTitle = doc.splitTextToSize(item.itemName, 170);
    doc.text(splitTitle, 20, 55);

    // Details Box (Full Width now)
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.rect(20, 65, 170, 50, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("VALOR ESTIMADO", 25, 75);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const splitValue = doc.splitTextToSize(item.estimatedValue || "N/A", 160);
    doc.text(splitValue, 25, 82);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("ÉPOCA:", 25, 96);
    doc.setTextColor(0, 0, 0);
    doc.text(item.epocaEstimada || "No especificada", 25, 101);

    doc.setTextColor(100, 100, 100);
    doc.text("MATERIAL:", 110, 96);
    doc.setTextColor(0, 0, 0);
    const splitMaterial = doc.splitTextToSize(item.materiales || "No especificado", 75);
    doc.text(splitMaterial, 110, 101);

    // Description
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ANÁLISIS DE AUTENTICIDAD", 20, 130);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitAuth = doc.splitTextToSize(item.authenticityMarkers || item.description, 170);
    doc.text(splitAuth, 20, 140);
    
    let yPos = 140 + (splitAuth.length * 5) + 10;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ESTADO DE CONSERVACIÓN", 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitCond = doc.splitTextToSize(item.estadoConservacion || "No evaluado", 170);
    doc.text(splitCond, 20, yPos);
    yPos += (splitCond.length * 5) + 10;
    
    if (item.hallmarkAnalysis && item.hallmarkAnalysis !== "No analizado" && !item.hallmarkAnalysis.includes("No se analizó detalle")) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(138, 43, 226); // Purple for OCR
        doc.text("ESCÁNER OCR (FIRMAS Y SELLOS)", 20, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(0, 0, 0);
        const splitHallmark = doc.splitTextToSize(item.hallmarkAnalysis, 170);
        doc.text(splitHallmark, 20, yPos);
        yPos += (splitHallmark.length * 5) + 10;
    }
    
    // Render Images at the bottom (yPos)
    try {
        let imgSize = 60;
        // The footer starts at 270. We want to leave 10px margin -> max bottom is 260.
        if (yPos + imgSize > 255) {
            imgSize = 255 - yPos;
            if (imgSize < 20) imgSize = 20; // Ensure it doesn't get ridiculously small
        }
        
        if (imageUrl && !imageUrl.startsWith('data:image/svg')) {
            doc.addImage(imageUrl, "JPEG", 20, yPos, imgSize, imgSize);
        }
        if (detailImg && !detailImg.startsWith('data:image/svg')) {
            doc.addImage(detailImg, "JPEG", 20 + imgSize + 10, yPos, imgSize, imgSize);
        }
    } catch(e) {
        console.log("Error agregando imagenes al PDF", e);
    }

    // Footer
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(1);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Este certificado es generado por Inteligencia Artificial y representa una estimación basada en el mercado digital. No constituye un documento legal vinculante.", 105, 278, { align: "center", maxWidth: 170 });
    
    doc.save(`Certificado_RelicLens_${item.itemName.replace(/\s+/g, '_')}.pdf`);
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
      ) : originalImage && !isAnalyzing && !result ? (
        <div className="glass-panel result-box animate-fade-in configuration-screen">
          <h2 className="result-title" style={{ textAlign: "center", marginBottom: "1rem" }}>Configuración del Análisis</h2>
          
          <div className="preview-thumbnails" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
            <div className="thumb-box" style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #FFD700' }}>
               <img src={originalImage} alt="General" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.7)', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>Plano General</div>
            </div>
            
            <div className="thumb-box" onClick={() => detailInputRef.current?.click()} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '2px dashed var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
               {detailImage ? (
                 <>
                   <img src={detailImage} alt="Detalle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.7)', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>Detalle / Sello</div>
                 </>
               ) : (
                 <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🔍</div>
                    + Añadir<br/>Detalle
                 </div>
               )}
            </div>
            <input type="file" accept="image/*" ref={detailInputRef} onChange={handleDetailFileChange} style={{ display: 'none' }} />
          </div>

          <div className="provenance-section" style={{ marginBottom: '1.5rem' }}>
             <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Historia del objeto (Opcional):</label>
             <textarea 
               value={provenanceText}
               onChange={(e) => setProvenanceText(e.target.value)}
               placeholder="Ej: Era de mi abuela, comprado en España en 1950..."
               style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--foreground)', minHeight: '80px', fontSize: '0.9rem', resize: 'vertical' }}
             />
          </div>

          <button className="btn-primary w-full" onClick={handleAnalyze} style={{ marginBottom: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
             Comenzar Tasación IA
          </button>
          
          <button className="btn-secondary w-full" onClick={() => { setOriginalImage(null); setDetailImage(null); setProvenanceText(""); }}>
             Cancelar
          </button>
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

          {!isAnalyzing && result && !result.error && (!result.items || result.items.length === 0) && (
            <div className="analysis-result-list animate-fade-in" style={{ marginTop: '2rem', textAlign: 'center' }}>
               <h2 className="result-title" style={{ color: '#ff4d4d', fontSize: '1.5rem', marginBottom: '1rem' }}>❌ Sin valor de subasta detectado</h2>
               <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>La Inteligencia Artificial ha examinado la imagen y no ha encontrado ninguna antigüedad o pieza que justifique un valor comercial en el mercado de subastas. Los objetos presentes parecen ser de producción masiva, réplicas o decoración moderna.</p>
               <button className="btn-primary" onClick={() => { setOriginalImage(null); setResult(null); setDetailImage(null); setProvenanceText(""); }}>Escanear otra foto</button>
            </div>
          )}

          {!isAnalyzing && result && !result.error && result.items && result.items.length > 0 && (
            <div className="analysis-result-list animate-fade-in" style={{ marginTop: '2rem' }}>
              <h2 className="result-title" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                🌟 Top {result.items.length} Objetos Valiosos Detectados
              </h2>
              
              {result.items.map((item: any, itemIndex: number) => (
                <div key={itemIndex} className="analysis-result" style={{ marginBottom: "2rem", borderTop: itemIndex > 0 ? "1px solid var(--border-color)" : "none", paddingTop: itemIndex > 0 ? "2rem" : "0" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 className="result-title" style={{ fontSize: "1.5rem", marginTop: 0, marginBottom: 0 }}>
                      {itemIndex + 1}. {item.itemName}
                    </h3>
                    <button 
                      onClick={() => generatePDF(item, originalImage!, detailImage)}
                      style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      📄 Exportar PDF
                    </button>
                  </div>
                  <p className="result-value" style={{ fontSize: "1.2rem", color: "#FFD700", margin: "0.5rem 0" }}>
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
                  
                  {item.hallmarkAnalysis && item.hallmarkAnalysis !== "No analizado" && !item.hallmarkAnalysis.includes("No se analizó detalle") && (
                     <div style={{ background: 'linear-gradient(to right, rgba(138, 43, 226, 0.1), rgba(0, 0, 0, 0))', borderLeft: '4px solid #8A2BE2', padding: '0.8rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        <span style={{ color: '#8A2BE2', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                           🔍 Escáner OCR de Firmas y Sellos
                        </span>
                        <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{item.hallmarkAnalysis}</span>
                     </div>
                  )}

                  <p className="result-desc" style={{ marginBottom: "1rem", lineHeight: '1.5' }}>{item.description}</p>
                        
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
            <button className="btn-secondary mt-4 w-full" onClick={() => { setOriginalImage(null); setDetailImage(null); setProvenanceText(""); }}>
              Analizar otra foto
            </button>
          )}
        </div>
      )}

      
    </div>
  );
}
