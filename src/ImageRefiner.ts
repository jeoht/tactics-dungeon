/*
* Safari and Edge polyfill for createImageBitmap
* https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap
*
* Support source image types Blob and ImageData.
*
* From: https://dev.to/nektro/createimagebitmap-polyfill-for-safari-and-edge-228
* Updated by Yoan Tournade <yoan@ytotech.com>
*/
if (!('createImageBitmap' in window)) {
	(window as any).createImageBitmap = async function (data: Blob|ImageData) {
		return new Promise((resolve,reject) => {
			let dataURL;
			if (data instanceof Blob) {
				dataURL = URL.createObjectURL(data);
			} else if (data instanceof ImageData) {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d')!;
				canvas.width = data.width;
				canvas.height = data.height;
				ctx.putImageData(data,0,0);
				dataURL = canvas.toDataURL();
			} else {
				throw new Error('createImageBitmap does not handle the provided image source type');
			}
			const img = document.createElement('img');
			img.addEventListener('load',function () {
				resolve(this);
			});
			img.src = dataURL;
		});
	};
}

export class RefiningImage {
    imgRefiner: ImageRefiner
    imgData: ImageData
    constructor(imgRefiner: ImageRefiner, imgData: ImageData) {
        this.imgRefiner = imgRefiner
        this.imgData = imgData
    }

    grayscale() {
        const { data } = this.imgData

        let r, g, b, avg
        for (let p = 0, len = data.length; p < len; p += 4) {
            r = data[p]
            g = data[p+1];
            b = data[p+2];
            // alpha channel (p+3) is ignored           

            avg = Math.floor((r+g+b)/3);

            data[p] = data[p+1] = data[p+2] = avg;
        }
        return this
    }

    async bitmap() {
        return createImageBitmap(this.imgData)
    }
}

export class ImageRefiner {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    constructor() {
        this.canvas = document.createElement("canvas")
        this.ctx = this.canvas.getContext("2d")!
    }

    editImage(img: HTMLImageElement|ImageBitmap) {
        const { canvas, ctx } = this
        canvas.width = 'naturalWidth' in img ? img.naturalWidth : img.width
        canvas.height = 'naturalHeight' in img ? img.naturalHeight : img.height
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        return this.edit(imgData)
    }

    edit(img: HTMLImageElement|ImageBitmap|ImageData): RefiningImage {
        if (img instanceof ImageData) {
            return new RefiningImage(this, img)
        } else {
            return this.editImage(img)
        }
    }
}


function tintedImage(imgElement: HTMLImageElement,tintColor: string) {
    // create hidden canvas (using image dimensions)
    var canvas = document.createElement("canvas");
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    var ctx = canvas.getContext("2d")!;
    ctx.drawImage(imgElement,0,0);

    var map = ctx.getImageData(0,0,320,240);
    var imdata = map.data;

    // convert image to grayscale
    var r,g,b,avg;
    for(var p = 0, len = imdata.length; p < len; p+=4) {
        r = imdata[p]
        g = imdata[p+1];
        b = imdata[p+2];
        // alpha channel (p+3) is ignored           

        avg = Math.floor((r+g+b)/3);

        imdata[p] = imdata[p+1] = imdata[p+2] = avg;
    }

    ctx.putImageData(map,0,0);

    // // overlay filled rectangle using lighter composition
    // ctx.globalCompositeOperation = "lighter";
    // ctx.globalAlpha = 0.5;
    // ctx.fillStyle=tintColor;
    // ctx.fillRect(0,0,canvas.width,canvas.height);

    const img = new Image()
    img.src = canvas.toDataURL()
    return img
}
