import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "@/store";
import { AuthGuard } from "@/components/admin/AuthGuard";
import { CustomerAuthGuard } from "@/components/auth/CustomerAuthGuard";
import { ShopAuthGuard } from "@/components/shop-partner/ShopAuthGuard";
import { ShopLayout } from "@/components/shop-partner/ShopLayout";
import { LoginModalProvider } from "@/components/auth/LoginModalProvider";
import { IncomingCallProvider } from "@/components/calls/IncomingCallProvider";
import { AdminCallProvider } from "@/components/calls/AdminCallProvider";
import { useRouter } from "next/router";
import { Toaster } from "sonner";
import { Manrope, Bricolage_Grotesque } from "next/font/google";

// ─── Self-hosted, preloaded fonts via next/font ────────────────────────
// Manrope for body / UI text — warm, modern, highly legible on screens
// without the over-used Inter look. Generous x-height keeps prices and
// product specs scannable at small sizes.
// Bricolage Grotesque for display / headings — variable optical-size
// grotesque with quietly distinctive curves; gives the brand a premium,
// editorial feel that doesn't read as a Tailwind starter.
// Both are exposed as CSS variables so Tailwind can wire them into
// `font-sans` and `font-display` utility classes (see tailwind.config.js).
const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Admin pages that don't need admin auth
const adminPublicPaths = ['/admin/login'];

// Shop partner pages that don't need shop auth
const shopPublicPaths = ['/shop-partner/login'];

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

function needsCustomerAuth(pathname: string) {
  return customerProtectedPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <Provider store={store}>
      {/* Expose the fonts at :root so PORTALED content (dialogs, toasts,
          dropdowns) — which mounts on document.body, outside the wrapper div —
          uses the app font instead of falling back to a system serif/sans. */}
      <style jsx global>{`
        :root {
          --font-body: ${body.style.fontFamily};
          --font-display: ${display.style.fontFamily};
        }
      `}</style>
      <LoginModalProvider>
      <AdminCallProvider>
      <IncomingCallProvider>
      <div className={`${body.variable} ${display.variable} font-sans`}>
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
        ) : needsCustomerAuth(router.pathname) ? (
          <CustomerAuthGuard>
            <Component {...pageProps} />
          </CustomerAuthGuard>
        ) : (
          <Component {...pageProps} />
        )}
      </div>
      </IncomingCallProvider>
      </AdminCallProvider>
      </LoginModalProvider>
    </Provider>
  );
}
