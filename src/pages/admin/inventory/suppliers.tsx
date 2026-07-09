import type { GetServerSideProps } from 'next'

// This page previously rendered a mock-data inventory screen (not in the admin
// nav). Redirect to the live Purchase Ledger (real supplier/purchase data) so
// placeholder numbers are never shown.
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/admin/inventory/purchases', permanent: false },
})

export default function AdminInventorySuppliersRedirect() {
  return null
}
