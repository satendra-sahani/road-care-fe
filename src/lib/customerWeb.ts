// Customer login and service booking on the WEBSITE are switched off for now:
// customers use the mobile app. Anything that would open the customer login, and
// the "book a service" action, sends the visitor to the Play Store / App Store
// instead (through /app, which picks the store for the device).
//
// Nothing was deleted — the login dialog, the /login page and the booking flow are
// all still in the code behind this switch. To bring them back, build the site
// with  NEXT_PUBLIC_CUSTOMER_WEB=on  (or change the default below).
//
// Not affected: admin (/admin), shop partners (/shop-partner), franchise
// (/franchise), field staff (/manager), partner registration (/register/*) and
// every public page — they have their own logins or need none.
import { APP_STORE_URL, PLAY_STORE_URL } from './appLinks'

/** true = customers can log in and book on the website; false = they are sent to the app */
export const CUSTOMER_WEB = process.env.NEXT_PUBLIC_CUSTOMER_WEB === 'on'

/** the store for this device: App Store on Apple devices, Google Play everywhere else */
export const storeUrlFor = (userAgent: string) => (/iPhone|iPad|iPod|Macintosh/i.test(userAgent || '') ? APP_STORE_URL : PLAY_STORE_URL)

let leaving = false
/** Send the visitor to the app's store page. Safe to call more than once. */
export function sendToApp() {
  if (typeof window === 'undefined' || leaving) return
  leaving = true
  // let the page come back to life if the visitor returns with the Back button
  window.addEventListener('pageshow', () => { leaving = false }, { once: true })
  window.setTimeout(() => { leaving = false }, 4000)
  window.location.assign(storeUrlFor(navigator.userAgent))
}
