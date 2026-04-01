const fs = require("fs");
const sharp = require("sharp");
const { fileTypeFromBuffer } = require("file-type");

async function validateAndSanitizeImage(filePath) {
    console.log("working");
  const buffer = fs.readFileSync(filePath);
  const type = await fileTypeFromBuffer(buffer);

  if (!type || !["image/jpeg", "image/png"].includes(type.mime)) {
    fs.unlinkSync(filePath);
    throw new Error("Only real JPG/PNG images are allowed.");
  }

  const outPath = filePath;
  const img = sharp(buffer, { failOnError: true });

  if (type.mime === "image/jpeg") {
    await img.jpeg({ quality: 85, mozjpeg: true }).toFile(outPath + ".tmp");
  } else {
    await img.png({ compressionLevel: 9 }).toFile(outPath + ".tmp");
  }

  fs.renameSync(outPath + ".tmp", outPath);
  return true;
}

module.exports = { validateAndSanitizeImage };
