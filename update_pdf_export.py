import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'r') as f:
    content = f.read()

# Add imports
imports_old = """import { saveRelic } from "@/lib/db";"""
imports_new = """import { saveRelic } from "@/lib/db";
import jsPDF from "jspdf";"""
content = content.replace(imports_old, imports_new)

# Add generatePDF function
generate_pdf_func = """
  const generatePDF = (item: any, imageUrl: string) => {
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

    // Image (assuming originalImage is jpeg/png)
    if (imageUrl && !imageUrl.startsWith('data:image/svg')) {
       try {
           doc.addImage(imageUrl, "JPEG", 130, 60, 60, 60);
       } catch(e) {
           console.log("Error agregando imagen al PDF", e);
       }
    }

    // Details Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.rect(20, 65, 100, 50, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("VALOR ESTIMADO", 25, 75);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(item.estimatedValue || "N/A", 25, 82);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("ÉPOCA:", 25, 92);
    doc.setTextColor(0, 0, 0);
    doc.text(item.epocaEstimada || "No especificada", 25, 97);

    doc.setTextColor(100, 100, 100);
    doc.text("MATERIAL:", 25, 107);
    doc.setTextColor(0, 0, 0);
    doc.text(item.materiales || "No especificado", 25, 112);

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

    // Footer
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(1);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Este certificado es generado por Inteligencia Artificial y representa una estimación basada en el mercado digital. No constituye un documento legal vinculante.", 105, 278, { align: "center", maxWidth: 170 });
    
    doc.save(`Certificado_RelicLens_${item.itemName.replace(/\s+/g, '_')}.pdf`);
  };
"""

content = content.replace("  const overlay = getOverlayStylesForVault(result);", generate_pdf_func + "\n  const overlay = getOverlayStylesForVault(result);")

# Add button
btn_old = """                  <h3 className="result-title" style={{ fontSize: "1.5rem", marginTop: 0 }}>
                    {itemIndex + 1}. {item.itemName}
                  </h3>"""
btn_new = """                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 className="result-title" style={{ fontSize: "1.5rem", marginTop: 0, marginBottom: 0 }}>
                      {itemIndex + 1}. {item.itemName}
                    </h3>
                    <button 
                      onClick={() => generatePDF(item, originalImage!)}
                      style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#000', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      📄 Exportar PDF
                    </button>
                  </div>"""
content = content.replace(btn_old, btn_new)

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'w') as f:
    f.write(content)
