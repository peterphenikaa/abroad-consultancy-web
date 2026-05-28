/**
 * Tạo cặp khóa RS256 cho auth + gateway (dev).
 * Chạy: node scripts/generate-dev-jwt-keys.js
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const dir = path.resolve(__dirname, "..", "dev-keys");
fs.mkdirSync(dir, { recursive: true });

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

const privPath = path.join(dir, "jwt-private.pem");
const pubPath = path.join(dir, "jwt-public.pem");
fs.writeFileSync(privPath, privateKey);
fs.writeFileSync(pubPath, publicKey);
console.log("Wrote", privPath, pubPath);
