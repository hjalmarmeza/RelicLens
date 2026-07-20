import re

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'r') as f:
    content = f.read()

# 1. Fix material text overflow
material_old = """    doc.setTextColor(100, 100, 100);
    doc.text("MATERIAL:", 110, 96);
    doc.setTextColor(0, 0, 0);
    doc.text(item.materiales || "No especificado", 110, 101);"""

material_new = """    doc.setTextColor(100, 100, 100);
    doc.text("MATERIAL:", 110, 96);
    doc.setTextColor(0, 0, 0);
    const splitMaterial = doc.splitTextToSize(item.materiales || "No especificado", 75);
    doc.text(splitMaterial, 110, 101);"""

content = content.replace(material_old, material_new)

# 2. Fix image overlapping with footer
img_old = """    // Render Images at the bottom (yPos)
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

img_new = """    // Render Images at the bottom (yPos)
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
    }"""

content = content.replace(img_old, img_new)

with open('/Users/hjalmarmeza/Downloads/Antigravity/RelicLens/src/components/ImageUploader.tsx', 'w') as f:
    f.write(content)

