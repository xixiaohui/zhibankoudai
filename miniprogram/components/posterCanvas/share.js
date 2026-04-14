function loadImage(canvas, src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('图片地址为空'));
      return;
    }

    const img = canvas.createImage();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

async function drawImage(canvas, ctx, src, x, y, w, h) {
  const img = await loadImage(canvas, src);
  ctx.drawImage(img, x, y, w, h);
}

module.exports = {
  loadImage,
  drawImage,
};