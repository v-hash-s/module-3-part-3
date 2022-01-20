import * as sharp from "sharp";
import { log } from "helper/logger";

export class sharpImage {
  async sharp(image) {
    const resizedImage = await sharp(image.data)
      .resize({ width: 512, height: 250 })
      .toBuffer();
    log(resizedImage);
  }
}

/////////// SHARP LOGIC
// const resizedImage = await sharp(image.data)
//   .resize({ width: 512, height: 250 })
//   .toBuffer();
// log(resizedImage);
//////////
