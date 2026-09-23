from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path('/home/ubuntu/quji-event-platform-vue3')
SOURCE_ID = Path('/home/ubuntu/upload/search_images/i6gN35iLDwNc.png')
SOURCE_AUTH = Path('/tmp/quji-authorization-page.png')
OUTPUT_DIR = ROOT / 'public' / 'materials'


def trim_white(image: Image.Image, tolerance: int = 12) -> Image.Image:
    rgb = image.convert('RGB')
    background = Image.new('RGB', rgb.size, (255, 255, 255))
    difference = ImageChops.difference(rgb, background)
    difference = difference.point(lambda value: 0 if value <= tolerance else value)
    bounds = difference.getbbox()
    return rgb.crop(bounds) if bounds else rgb


def save_webp(image: Image.Image, path: Path, max_width: int = 1280) -> None:
    image = image.convert('RGB')
    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)
    image.save(path, 'WEBP', quality=86, method=6)


OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

combined = Image.open(SOURCE_ID)
identity_back = combined.crop((0, 0, combined.width, 606))
save_webp(identity_back, OUTPUT_DIR / 'quji-public-identity-back-sample.webp')

authorization = trim_white(Image.open(SOURCE_AUTH))
save_webp(authorization, OUTPUT_DIR / 'quji-public-authorization-sample.webp', max_width=1200)
