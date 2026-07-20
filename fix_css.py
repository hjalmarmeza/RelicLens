import re
import os

def process_file(filepath, global_css_path):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find <style jsx>{` ... `}</style>
    pattern = re.compile(r'<style jsx>\{\`(.*?)\`\}</style>', re.DOTALL)
    matches = pattern.findall(content)
    
    if not matches:
        return
    
    # Append CSS to globals.css
    with open(global_css_path, 'a', encoding='utf-8') as gf:
        gf.write("\n/* Styles extracted from " + os.path.basename(filepath) + " */\n")
        for match in matches:
            gf.write(match + "\n")
            
    # Remove the style blocks from the original file
    new_content = pattern.sub('', content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Processed {filepath}")

global_css = "src/app/globals.css"
process_file("src/app/page.tsx", global_css)
process_file("src/components/ImageUploader.tsx", global_css)
process_file("src/components/RelicVault.tsx", global_css)

