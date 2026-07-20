import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'r') as f:
    content = f.read()

# Add states
states_addition = """  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [griddedImage, setGriddedImage] = useState<string | null>(null);
  const [detailImage, setDetailImage] = useState<string | null>(null);
  const [provenanceText, setProvenanceText] = useState("");
"""
content = re.sub(r'const \[originalImage, setOriginalImage\] = useState<string \| null>\(null\);', states_addition, content)

# Change handleFileChange
handle_file_change_old = """  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // IMPORTANTE: Limpiar el valor para permitir subir la misma foto dos veces seguidas en Safari
    if (e.target) {
        e.target.value = '';
    }

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
  };"""

handle_file_change_new = """  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };"""

content = content.replace(handle_file_change_old, handle_file_change_new)

# Add detail input ref
content = content.replace('const fileInputRef = useRef<HTMLInputElement>(null);', 'const fileInputRef = useRef<HTMLInputElement>(null);\n  const detailInputRef = useRef<HTMLInputElement>(null);')

# Now handle the UI for configuration
ui_old = """      {!originalImage ? (
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
      ) : ("""

ui_new = """      {!originalImage ? (
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
      ) : ("""

content = content.replace(ui_old, ui_new)

# Update resetting of state
content = content.replace('setOriginalImage(null); setResult(null);', 'setOriginalImage(null); setResult(null); setDetailImage(null); setProvenanceText("");')
content = content.replace('onClick={() => setOriginalImage(null)}', 'onClick={() => { setOriginalImage(null); setDetailImage(null); setProvenanceText(""); }}')


with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'w') as f:
    f.write(content)
