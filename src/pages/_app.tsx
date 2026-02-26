import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "@/store";
import { AuthGuard } from "@/components/admin/AuthGuard";
import { useRouter } from "next/router";
import { Toaster } from "sonner";

// Pages that don't need auth
const publicPaths = ['/admin/login', '/', '/cart', '/checkout'];

function isPublicPath(pathname: string) {
  return publicPaths.some(p => pathname === p) || !pathname.startsWith('/admin');
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const needsAuth = router.pathname.startsWith('/admin') && !isPublicPath(router.pathname);

  return (
    <Provider store={store}>
      <Toaster position="top-right" richColors closeButton />
      {needsAuth ? (
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      ) : (
        <Component {...pageProps} />
      )}
    </Provider>
  );
}
