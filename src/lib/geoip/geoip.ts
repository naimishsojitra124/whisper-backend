import { open, Reader } from "maxmind";
import type { CityResponse } from "maxmind";
import path from "path";

let reader: Reader<CityResponse> | null = null;

async function getReader() {
  if (!reader) {
    reader = await open<CityResponse>(path.join(__dirname, "GeoIP2-City.mmdb"));
  }
  return reader;
}

export interface GeoLocation {
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

export async function lookupGeoIp(ip?: string): Promise<GeoLocation | null> {
  if (!ip || ip.startsWith("127.") || ip === "::1") {
    return null;
  }

  try {
    const db = await getReader();
    const result = db.get(ip);

    if (!result) return null;

    return {
      country: result.country?.names?.en,
      region: result.subdivisions?.[0]?.names?.en,
      city: result.city?.names?.en ?? undefined,
      latitude: result.location?.latitude,
      longitude: result.location?.longitude,
    };
  } catch {
    return null;
  }
}
