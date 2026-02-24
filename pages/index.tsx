import { GetServerSideProps } from 'next'

// Redirect / (site root) to /login so the login UI is shown at the canonical URL
export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: '/login',
      permanent: false,
    },
  }
}

export default function Home() {
  // This component is never rendered because we redirect in getServerSideProps,
  // but we still export a default to satisfy Next's page requirement.
  return null
}
