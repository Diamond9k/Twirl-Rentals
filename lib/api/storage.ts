import * as FileSystem from "expo-file-system";

import { supabase } from "@/lib/supabase";

/** Minimal base64 → Uint8Array (avoids a runtime atob/Buffer dependency). */
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = clean.length;
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  const byteLength = (len * 3) / 4 - padding;
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = B64.indexOf(clean[i]);
    const b = B64.indexOf(clean[i + 1]);
    const c = B64.indexOf(clean[i + 2]);
    const d = B64.indexOf(clean[i + 3]);

    bytes[p++] = (a << 2) | (b >> 4);
    if (p < byteLength) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < byteLength) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes;
}

function extFromUri(uri: string): { ext: string; contentType: string } {
  const match = /\.(\w+)(?:\?.*)?$/.exec(uri);
  const ext = (match?.[1] ?? "jpg").toLowerCase();
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "heic"
          ? "image/heic"
          : "image/jpeg";
  return { ext: ext === "jpeg" ? "jpg" : ext, contentType };
}

/**
 * Upload a local image (from expo-image-picker) into a public bucket under the
 * user's own folder (required by storage RLS) and return its public URL.
 */
export async function uploadImage(
  bucket: "avatars" | "item-images",
  userId: string,
  localUri: string,
): Promise<string> {
  const { ext, contentType } = extFromUri(localUri);
  const path = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, base64ToBytes(base64), { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImages(
  bucket: "avatars" | "item-images",
  userId: string,
  localUris: string[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of localUris) {
    // Remote URLs (already uploaded) pass through unchanged.
    if (/^https?:\/\//.test(uri)) {
      urls.push(uri);
    } else {
      urls.push(await uploadImage(bucket, userId, uri));
    }
  }
  return urls;
}
