import * as sharp from "sharp";
import { log } from "helper/logger";

export class sharpImage {
  async sharp(image) {
    log("image in sharp length");
    const resizedImage = await sharp(image)
      .resize(512, 250, { fit: sharp.fit.cover })
      .toBuffer();
    log(resizedImage);
    return resizedImage;
  }
}

/////////// SHARP LOGIC
// const resizedImage = await sharp(image.data)
//   .resize({ width: 512, height: 250 })
//   .toBuffer();
// log(resizedImage);
//////////
