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
              legalName: "Bharatmechanics Private Limited",
              url: "https://bharatmechanics.com",
              logo: "https://bharatmechanics.com/brand-logo-v3.png",
              description:
                "Bharatmechanics Private Limited (\"Bharat Mechanics\") is India's trusted, tech-driven platform for doorstep and workshop vehicle care. We connect car and two-wheeler owners with verified mechanics and shop partners for on-site repairs, servicing, roadside assistance, and maintenance — booked in minutes through our app. Alongside services, we run an online marketplace for genuine automobile spare parts and accessories, delivered fast and priced upfront. Our network of trained, background-verified experts ensures reliable, transparent, professional care for every drive. We also invest in mechanic skill-development programs and build our own software to power seamless bookings, live tracking, and payments — making quality vehicle care accessible and hassle-free across India.",
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
