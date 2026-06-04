import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

export function generateTotpSecret(email: string) {
  const secret = generateSecret();
  const otpauth = generateURI({ issuer: "dopamine", label: email, secret });
  return { secret, otpauth };
}

export async function totpQrDataUrl(otpauth: string) {
  return QRCode.toDataURL(otpauth);
}

export async function verifyTotpCode(secret: string, token: string) {
  const result = await verify({ token, secret });
  return result.valid;
}
