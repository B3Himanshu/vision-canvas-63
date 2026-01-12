import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";
import { OrganizationSchema, WebsiteSchema } from "@/components/seo/StructuredData";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelvault.com';
const siteName = 'PixelVault';
const siteDescription = 'Discover thousands of free high-quality images for your projects. Browse, search, and download stunning photos, illustrations, and graphics. Always free, no limits.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Free High-Quality Images`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'free images',
    'stock photos',
    'high quality images',
    'free photos',
    'royalty free images',
    'stock photography',
    'free stock photos',
    'image gallery',
    'free pictures',
    'download images',
    'free graphics',
    'stock images',
  ],
  authors: [{ name: 'PixelVault' }],
  creator: 'PixelVault',
  publisher: 'PixelVault',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} - Free High-Quality Images`,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/placeholder.svg`,
        width: 1200,
        height: 630,
        alt: 'PixelVault - Free High-Quality Images',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Free High-Quality Images`,
    description: siteDescription,
    images: [`${siteUrl}/placeholder.svg`],
    creator: '@pixelvault',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <OrganizationSchema siteUrl={siteUrl} siteName={siteName} />
        <WebsiteSchema siteUrl={siteUrl} siteName={siteName} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
