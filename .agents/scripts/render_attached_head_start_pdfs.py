from pathlib import Path
import fitz

out = Path(".agents/outputs/early-childhood-rfp")
out.mkdir(parents=True, exist_ok=True)

for pdf in sorted(Path("attached_assets").glob("2025-23_*.pdf")):
    doc = fitz.open(pdf)
    print(f"{pdf.name}: pages={doc.page_count}, size={doc.metadata.get('format')}")
    for page_number in sorted({0, min(1, doc.page_count - 1), doc.page_count - 1}):
        page = doc.load_page(page_number)
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        output = out / f"{pdf.stem[:45]}-page-{page_number + 1}.png"
        pix.save(output)
        print(f"  rendered {output} {page.rect.width:.0f}x{page.rect.height:.0f}")