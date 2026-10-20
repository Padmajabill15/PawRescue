/** @type {import('next').NextConfig} */
const apiUrl = process.env.API_URL ?? "http://localhost:5000";

const nextConfig = {
  reactStrictMode: true,
  // Same-origin /api so the auth cookie works in dev and production
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
      // Live updates (socket.io long-polling) through the same origin
      { source: "/socket.io", destination: `${apiUrl}/socket.io` },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
