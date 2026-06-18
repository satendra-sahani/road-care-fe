import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* Theme & Brand */}
        <meta name="theme-color" content="#1B3B6F" />
        <meta name="author" content="Bharat Mechanics" />

        {/* Robots – allow all pages to be indexed and links followed */}
        <meta name="robots" content="index, follow" />

        {/* Razorpay */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />

        {/* JSON-LD Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Bharat Mechanics",
              url: "https://bharatmechanics.com",
              logo: "https://bharatmechanics.com/brand-logo.png?v=2",
              description:
                "India's trusted auto parts and vehicle service platform. Buy genuine car & bike parts, book certified mechanics, and get doorstep repair services.",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+91-1800-123-4567",
                contactType: "customer service",
                availableLanguage: ["English", "Hindi"],
              },
              sameAs: [],
            }),
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
