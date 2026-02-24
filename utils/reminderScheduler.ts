import { getAppBaseUrl } from './getAppBaseUrl'

// Cron job for sending automated reminders
// This can be run via a cron scheduler or manually via API call

const REMINDER_API_URL = `${getAppBaseUrl()}/api/reminders`

export async function sendReminders() {
  try {
    console.log('🔄 Starting automated reminder check...')

    const response = await fetch(REMINDER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Reminder check completed:', result)
      return result
    } else {
      console.error('❌ Reminder check failed:', response.status, response.statusText)
      return null
    }
  } catch (error) {
    console.error('❌ Error sending reminders:', error)
    return null
  }
}

// For manual testing via command line
if (require.main === module) {
  sendReminders()
    .then(() => {
      console.log('🎉 Reminder process completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Reminder process failed:', error)
      process.exit(1)
    })
}