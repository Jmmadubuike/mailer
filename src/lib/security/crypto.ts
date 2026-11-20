import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { getEnv } from "@/config/env";

export interface EncryptedBlob {
  ciphertext: string;
  iv: string;
  authTag: string;
}

function encryptionKey(): Buffer {
  const key = Buffer.from(getEnv().CREDENTIALS_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY must decode to exactly 32 bytes",
    );
  }
  return key;
}

export function encryptSecret(plaintext: string): EncryptedBlob {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptSecret(blob: EncryptedBlob): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(blob.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(blob.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 6) return "••••";
  return `re_••••${key.slice(-4)}`;
}
