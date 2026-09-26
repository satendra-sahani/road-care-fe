import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en-IN">
      <Head>
        {/* Favicon */}
        {/* Small, purpose-sized icons (the 512px favicon.png is kept only for Razorpay's merchant logo) */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme & Brand */}
        <meta name="theme-color" content="#0A2442" />
        <meta name="author" content="Bharat Mechanics" />

        {/* Robots – allow all pages to be indexed and links followed */}
        <meta name="robots" content="index, follow" />

        {/* JSON-LD Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Bharat Mechanics",
              legalName: "Bharat Mechanics Private Limited",
              url: "https://bharatmechanics.com",
              logo: "https://bharatmechanics.com/brand-logo-v3.png",
              description:
                "Bharat Mechanics Private Limited is India's trusted, tech-driven platform for doorstep and workshop vehicle care. We connect car and two-wheeler owners with verified mechanics and shop partners for on-site repairs, servicing, roadside assistance, and maintenance — booked in minutes through our app. Alongside services, we run an online marketplace for genuine automobile spare parts and accessories, delivered fast and priced upfront. Our network of trained, background-verified experts ensures reliable, transparent, professional care for every drive. We also invest in mechanic skill-development programs and build our own software to power seamless bookings, live tracking, and payments — making quality vehicle care accessible and hassle-free across India.",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+91-9310694349",
                contactType: "customer service",
                availableLanguage: ["English", "Hindi"],
              },
              sameAs: [
                "https://play.google.com/store/apps/details?id=com.bharatmechanics",
                "https://apps.apple.com/in/app/bharat-mechanics/id6806160528",
              ],
              // Where doorstep service is offered (city guides live under /blog/mechanic-in-*)
              areaServed: [
                ...["Gorakhpur", "Deoria", "Kushinagar", "Maharajganj"].map((d) => ({
                  "@type": "AdministrativeArea",
                  name: `${d} district, Uttar Pradesh`,
                })),
                ...["Gorakhpur", "Deoria", "Kushinagar", "Padrauna", "Kasia", "Hata", "Kaptanganj", "Ramkola", "Rudrapur", "Salempur", "Gauri Bazar", "Chauri Chaura", "Tamkuhi Raj", "Khadda", "Maharajganj", "Ghughli"].map((c) => ({
                  "@type": "City",
                  name: c,
                })),
              ],
              knowsAbout: ["Car repair", "Bike repair", "Doorstep vehicle service", "Roadside assistance", "Auto spare parts", "GPS vehicle tracking"],
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
