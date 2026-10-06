import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "@/store";
import { LoginModalProvider } from "@/components/auth/LoginModalProvider";
import { IncomingCallProvider } from "@/components/calls/IncomingCallProvider";
import { AdminCallProvider } from "@/components/calls/AdminCallProvider";
import { CookieConsent } from "@/components/CookieConsent";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Poppins } from "next/font/google";

// Admin / shop-partner / logged-in-customer guards are only used on protected
// (noindex) routes — split them out so public pages don't download them.
// ssr:false: these guards depend on the browser session (cookie); rendering them
// on the server with a lazily-loaded chunk caused a hydration mismatch.
const AuthGuard = dynamic(() => import("@/components/admin/AuthGuard").then((m) => m.AuthGuard), { ssr: false });
const ShopAuthGuard = dynamic(() => import("@/components/shop-partner/ShopAuthGuard").then((m) => m.ShopAuthGuard), { ssr: false });
// Customer guard only wraps logged-in pages (cart, orders, profile…).
const CustomerAuthGuard = dynamic(() => import("@/components/auth/CustomerAuthGuard").then((m) => m.CustomerAuthGuard), { ssr: false });
const ShopLayout = dynamic(() => import("@/components/shop-partner/ShopLayout").then((m) => m.ShopLayout));
// Franchise dashboard (/franchise/*): its own guard + sidebar layout
const FranchiseAuthGuard = dynamic(() => import("@/components/franchise/FranchiseAuthGuard").then((m) => m.FranchiseAuthGuard), { ssr: false });
const FranchiseLayout = dynamic(() => import("@/components/franchise/FranchiseLayout").then((m) => m.FranchiseLayout), { ssr: false });

// Toast host is client-only and not needed for first paint.
const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false });

// ─── Self-hosted, preloaded font via next/font ─────────────────────────
// Poppins for BOTH body and display text — matches the Claude Design
// handoff (website-design-buildout) used for the site redesign.
// Geometric, friendly and highly legible at UI sizes.
// The same family is exposed under both CSS variables so every existing
// `font-sans` / `font-display` utility keeps working unchanged
// (see tailwind.config.js).
// Both are exposed as CSS variables so Tailwind can wire them into
// `font-sans` and `font-display` utility classes (see tailwind.config.js).
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  fallback: ["system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

// Admin pages that don't need admin auth
const adminPublicPaths = ['/admin/login'];

// Shop partner pages that don't need shop auth
const shopPublicPaths = ['/shop-partner/login'];

// Franchise pages that don't need franchise auth
const franchisePublicPaths = ['/franchise/login'];

// Customer pages that need customer auth.
// NOTE: '/service' (the booking wizard) is intentionally NOT here — it should be
// browsable while logged out, with the login modal overlaying the (blurred) page
// only when the user actually books. The specific booking detail/track pages
// ('/service/[id]', '/service/[id]/track') stay protected since they load a
// user-specific request.
const customerProtectedPaths = ['/cart', '/checkout', '/orders', '/profile', '/service/[id]', '/addresses', '/wallet', '/notifications', '/reviews', '/emergency', '/spin', '/refer'];

function needsAdminAuth(pathname: string) {
  return pathname.startsWith('/admin') && !adminPublicPaths.includes(pathname);
}

function needsShopAuth(pathname: string) {
  return pathname.startsWith('/shop-partner') && !shopPublicPaths.includes(pathname);
}

function needsFranchiseAuth(pathname: string) {
  return (pathname === '/franchise' || pathname.startsWith('/franchise/')) && !franchisePublicPaths.includes(pathname);
}

function needsCustomerAuth(pathname: string) {
  return customerProtectedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <Provider store={store}>
      {/* Site-wide DEFAULT title + description. Any page that renders its own
          <SEOHead> / next-head <title> overrides these (next/head dedupes and
          the deeper page-level tag wins), so this is purely a safety net that
          guarantees no page is ever served "Untitled" to Google. */}
      <Head>
        <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Bharat Mechanics – Auto Parts & Doorstep Vehicle Service</title>
        <meta
          name="description"
          content="India's trusted auto parts and vehicle service platform. Genuine car & bike parts, certified mechanics, doorstep repair, and GPS vehicle tracking."
        />
      </Head>
      {/* Expose the fonts at :root so PORTALED content (dialogs, toasts,
          dropdowns) — which mounts on document.body, outside the wrapper div —
          uses the app font instead of falling back to a system serif/sans. */}
      <style jsx global>{`
        :root {
          --font-body: ${poppins.style.fontFamily};
          --font-display: ${poppins.style.fontFamily};
        }
      `}</style>
      <LoginModalProvider>
      <AdminCallProvider>
      <IncomingCallProvider>
      <div className={`${poppins.variable} font-sans`}>
        <Toaster position="top-right" richColors closeButton />
        {needsAdminAuth(router.pathname) ? (
          <AuthGuard>
            <Component {...pageProps} />
          </AuthGuard>
        ) : needsShopAuth(router.pathname) ? (
          <ShopAuthGuard>
            <ShopLayout>
              <Component {...pageProps} />
            </ShopLayout>
          </ShopAuthGuard>
        ) : needsFranchiseAuth(router.pathname) ? (
          <FranchiseAuthGuard>
            <FranchiseLayout>
              <Component {...pageProps} />
            </FranchiseLayout>
          </FranchiseAuthGuard>
        ) : needsCustomerAuth(router.pathname) ? (
          <CustomerAuthGuard>
            <Component {...pageProps} />
          </CustomerAuthGuard>
        ) : (
          <Component {...pageProps} />
        )}
        {/* the field executive app is a full-screen tool — no storefront cookie bar over its buttons */}
        {!router.pathname.startsWith('/manager') && <CookieConsent />}
      </div>
      </IncomingCallProvider>
      </AdminCallProvider>
      </LoginModalProvider>
    </Provider>
  );
}
