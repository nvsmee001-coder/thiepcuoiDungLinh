const optimizedPhotos = Object.freeze({
  "/media/airline-wedding.jpg": "/media/airline-wedding.webp",
  "/media/bacninh-banh-da-memory.png": "/media/bacninh-banh-da-memory.webp",
  "/media/bacninh-vai-thieu-memory.png": "/media/bacninh-vai-thieu-memory.webp",
  "/media/halong-memory.png": "/media/halong-memory.webp",
  "/media/hanoi-coffee-memory.png": "/media/hanoi-coffee-memory.webp",
  "/media/hanoi-pho-memory.png": "/media/hanoi-pho-memory.webp",
  "/media/shanghai-memory.png": "/media/shanghai-memory.webp",
  "/media/trong-dong-venue.png": "/media/trong-dong-venue.webp",
  "/media/wedding-venue.png": "/media/wedding-venue.webp",
  "/media/blue-dress-portrait.png": "/media/blue-dress-portrait.webp",
  "/media/wedding-couple-portrait.png": "/media/wedding-couple-portrait.webp",
});

export function optimizedPhoto(path) {
  return Object.hasOwn(optimizedPhotos, path) ? optimizedPhotos[path] : path;
}
