from PIL import Image

def process():
    src = Image.open('img/realistic-open-envelope.jpg').convert('RGBA')
    w, h = src.size

    # 1. First, make the outer white background transparent
    # The envelope paper has warm tones (R > G > B), background is clean white (R>245, G>245, B>245)
    bg_removed = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    src_pixels = src.load()
    bg_pixels = bg_removed.load()

    # Find the envelope bounding box and mask white background
    for y in range(h):
        for x in range(w):
            r, g, b, a = src_pixels[x, y]
            # If near white background outside envelope
            # The envelope apex is around (600, 50), bottom is around y=800, left 280, right 920
            # Let's check distance to pure white
            if (x < 280 or x > 920 or y < 50 or y > 810) and (r > 242 and g > 242 and b > 242):
                bg_pixels[x, y] = (0, 0, 0, 0)
            elif (r > 248 and g > 248 and b > 248) and (y < 350 or y > 790 or x < 290 or x > 910):
                bg_pixels[x, y] = (0, 0, 0, 0)
            else:
                bg_pixels[x, y] = (r, g, b, 255)

    bg_removed.save('img/envelope-back.png', 'PNG')
    print('Saved envelope-back.png')

    # 2. Extract the front pocket
    # The front pocket starts around y=355 on left/right edges, and dips to y=545 along the slit
    front_pocket = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    front_pixels = front_pocket.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = bg_pixels[x, y]
            if a == 0:
                continue

            # Determine if (x, y) is in the front pocket:
            # Cavity is roughly x in [415, 785] and y in [420, 545]
            # Left wing slopes from (280, 355) down to (415, 545)
            # Right wing slopes from (920, 355) down to (785, 545)
            # Center lip is at y >= 545
            in_pocket = False
            if y >= 545:
                in_pocket = True
            elif x < 415:
                # Left wing slope: y >= 355 + (x - 280) * (545 - 355) / (415 - 280)
                slope_y = 355 + (x - 280) * 190.0 / 135.0
                if y >= slope_y:
                    in_pocket = True
            elif x > 785:
                # Right wing slope: y >= 355 + (920 - x) * (545 - 355) / (920 - 785)
                slope_y = 355 + (920 - x) * 190.0 / 135.0
                if y >= slope_y:
                    in_pocket = True

            if in_pocket:
                front_pixels[x, y] = (r, g, b, 255)

    front_pocket.save('img/envelope-front.png', 'PNG')
    print('Saved envelope-front.png')

if __name__ == '__main__':
    process()
