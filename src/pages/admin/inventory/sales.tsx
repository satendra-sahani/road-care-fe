import type { GetServerSideProps } from 'next'

// This page previously rendered a mock-data sales ledger (not in the admin nav).
// Redirect to the live, API-backed Revenue page so placeholder numbers are
// never shown.
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/admin/financial/revenue', permanent: false },
})

export default function AdminSalesLedgerRedirect() {
  return null
}
