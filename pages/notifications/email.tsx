import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/', permanent: false }
})

export default function EmailNotificationPage(){
  // Page removed — redirecting to home
  return null
}
