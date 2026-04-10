import pdfplumber
import sys

sys.stdout.reconfigure(encoding='utf-8')

with pdfplumber.open(r'C:\Users\ASUS\Downloads\Ai Generalist - Assignments.pdf') as pdf:
    print(f'Total pages: {len(pdf.pages)}')
    print('')
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            print(f'=== PAGE {i+1} ===')
            print(text[:2500])
            print('\n' + '='*50 + '\n')
