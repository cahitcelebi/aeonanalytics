export function getDateRange(dateRange: string) {
  const endDate = new Date()
  const startDate = new Date()

  switch (dateRange) {
    case '1d':
      startDate.setDate(endDate.getDate() - 1)
      break
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(endDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(endDate.getDate() - 90)
      break
    default:
      startDate.setDate(endDate.getDate() - 7) // Default to 7 days
  }

  return {
    startDate,
    endDate
  }
} 