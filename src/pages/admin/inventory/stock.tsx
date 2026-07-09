import type { GetServerSideProps } from 'next'

// This page previously rendered a mock-data inventory screen (not in the admin
// nav). Until a real stock screen is built, redirect to the live, API-backed
// Products page so placeholder numbers are never shown.
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/admin/inventory/products', permanent: false },
})

export default function AdminInventoryStockRedirect() {
  return null
}
