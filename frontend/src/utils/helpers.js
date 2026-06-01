export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function truncateText(value, length = 80) {
  if (!value) return ''
  return value.length > length ? `${value.slice(0, length)}...` : value
}
