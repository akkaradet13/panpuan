import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Hosting CDN is not purged by revalidatePath and honours s-maxage.
  // Pages use `revalidate = 60`, so data reaches the CDN within ~2 minutes.
  expireTime: 120,
  images: {
    // Google account profile photos
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
