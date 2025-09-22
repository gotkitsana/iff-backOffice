import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

const formatDate = (date: Date | string) => {
  const d = dayjs(date)
  const buddhistYear = d.year() + 543
  return `${d.format('DD MMM')} ${buddhistYear}`
}

export default formatDate
