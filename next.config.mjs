/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "electricolor.com.co",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
