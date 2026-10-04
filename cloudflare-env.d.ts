declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    AUTH_ORIGIN?: string;
    BUCKET?: R2Bucket;
  }
}
