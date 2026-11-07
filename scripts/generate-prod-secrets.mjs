import crypto from "node:crypto";

console.log("==================================================================");
console.log("🔐 Production Cryptographic Secrets for Kanganheri Darpan");
console.log("==================================================================");
console.log("");
console.log("JWT_ACCESS_SECRET=" + crypto.randomBytes(32).toString("hex"));
console.log("JWT_REFRESH_SECRET=" + crypto.randomBytes(32).toString("hex"));
console.log("IP_HASH_SALT=" + crypto.randomBytes(16).toString("hex"));
console.log("");
console.log("Copy these secrets directly into your Vercel Project Environment Variables.");
console.log("==================================================================");
