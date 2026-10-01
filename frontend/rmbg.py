from rembg import remove, new_session
from PIL import Image

print("Loading image...")
input = Image.open('public/hero-pets-transparent.png')
print("Initializing u2netp lightweight model session...")
session = new_session('u2netp')
print("Extracting foreground transparency mask...")
output = remove(input, session=session)
print("Saving clean png...")
output.save('public/hero-pets-clean.png')
print("Done!")
