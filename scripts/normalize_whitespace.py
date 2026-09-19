from pathlib import Path

root = Path('/home/ubuntu/quji-event-platform-vue3/src')
for path in root.rglob('*'):
    if path.suffix not in {'.vue', '.ts', '.scss'}:
        continue
    text = path.read_text()
    normalized = text.replace('\u3000', ' ')
    if normalized != text:
        path.write_text(normalized)
        print(path)
