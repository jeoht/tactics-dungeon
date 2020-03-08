

export class Tileset {
    image: CanvasImageSource
    tileWidth: number
    tileHeight: number
    rows: number
    columns: number

    constructor(image: HTMLImageElement|ImageBitmap, tileWidth: number, tileHeight: number) {
        this.image = image
        this.tileWidth = tileWidth
        this.tileHeight = tileHeight

        const imgWidth = 'naturalWidth' in image ? image.naturalWidth : image.width
        const imgHeight = 'naturalHeight' in image ? image.naturalHeight : image.height
        this.rows = Math.floor(imgWidth / tileHeight)
        this.columns = Math.floor(imgHeight / tileWidth)
    }

    drawTile(ctx: CanvasRenderingContext2D, tileIndex: number, dx: number, dy: number, dWidth: number, dHeight: number) {
        const column = tileIndex % this.columns
        const row = Math.floor(tileIndex / this.columns)
        const sx = column * this.tileWidth
        const sy = row * this.tileHeight
        
        ctx.drawImage(this.image, sx, sy, this.tileWidth, this.tileHeight, dx-1, dy-1, dWidth+2, dHeight+2)        
    }
}