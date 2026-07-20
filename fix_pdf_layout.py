import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'r') as f:
    content = f.read()

# 1. Update function signature and layout
func_old = """  const generatePDF = (item: any, imageUrl: string) => {
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

func_new = """  const generatePDF = (item: any, imageUrl: string, detailImg?: string | null) => {
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
    doc.text(item.materiales || "No especificado", 110, 101);

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
        if (imageUrl && !imageUrl.startsWith('data:image/svg')) {
            // max height 60
            doc.addImage(imageUrl, "JPEG", 20, yPos, 60, 60);
        }
        if (detailImg && !detailImg.startsWith('data:image/svg')) {
            doc.addImage(detailImg, "JPEG", 90, yPos, 60, 60);
        }
    } catch(e) {
        console.log("Error agregando imagenes al PDF", e);
    }"""

content = content.replace(func_old, func_new)

# 2. Update generatePDF call
call_old = """onClick={() => generatePDF(item, originalImage!)}"""
call_new = """onClick={() => generatePDF(item, originalImage!, detailImage)}"""
content = content.replace(call_old, call_new)

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'w') as f:
    f.write(content)

