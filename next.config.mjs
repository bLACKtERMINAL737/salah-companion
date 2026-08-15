import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Service worker is disabled in dev so hot-reload isn't fighting a cached
  // shell. Build/deploy (`npm run build && npm start`, or Vercel) to test it.
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Google account profile photos, for Firebase Auth avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default withSerwist(nextConfig);
