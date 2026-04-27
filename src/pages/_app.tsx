import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "@/store";
import { AuthGuard } from "@/components/admin/AuthGuard";
import { CustomerAuthGuard } from "@/components/auth/CustomerAuthGuard";
import { ShopAuthGuard } from "@/components/shop-partner/ShopAuthGuard";
import { ShopLayout } from "@/components/shop-partner/ShopLayout";
import { useRouter } from "next/router";
import { Toaster } from "sonner";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

// ─── Self-hosted, preloaded fonts via next/font ────────────────────────
// Inter for body / UI text — clean, dense, optimised for screens.
// Plus Jakarta Sans for display / headings — slightly more characterful,
// gives headings a premium editorial feel without losing legibility.
// Both are exposed as CSS variables so Tailwind can wire them into
// `font-sans` and `font-display` utility classes (see tailwind.config.js).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Admin pages that don't need admin auth
const adminPublicPaths = ['/admin/login'];

// Shop partner pages that don't need shop auth
const shopPublicPaths = ['/shop-partner/login'];

// Customer pages that need customer auth
const customerProtectedPaths = ['/cart', '/checkout', '/orders', '/profile', '/service', '/addresses', '/wallet', '/notifications', '/reviews', '/ai-booking', '/emergency'];

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
      <div className={`${inter.variable} ${jakarta.variable} font-sans`}>
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
    </Provider>
  );
}
