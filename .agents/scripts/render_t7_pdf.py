import fitz, os
src='attached_assets/Social_Impact_Grant_Challenge_-_T7_Summit_2026_1787589751748.pdf'
out='.agents/outputs/t7-pages'
os.makedirs(out, exist_ok=True)
doc=fitz.open(src)
print('pages', doc.page_count, 'metadata', doc.metadata)
for i,p in enumerate(doc):
    pix=p.get_pixmap(matrix=fitz.Matrix(1.5,1.5), alpha=False)
    path=f'{out}/page-{i+1}.png'
    pix.save(path)
    print(path)
