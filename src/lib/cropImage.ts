export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (err) => reject(err))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

/**
 * Crops `imageSrc` to `pixelCrop` (in natural pixels, from react-easy-crop) and
 * scales the result to exactly `outWidth` x `outHeight`. Returns a JPEG Blob so
 * the uploaded banner always matches the slot's aspect ratio — no letterbox bars.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  outWidth: number,
  outHeight: number,
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = outHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // White backstop so transparent PNGs don't turn black when flattened to JPEG.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, outWidth, outHeight)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outWidth,
    outHeight,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      'image/jpeg',
      0.92,
    )
  })
}
