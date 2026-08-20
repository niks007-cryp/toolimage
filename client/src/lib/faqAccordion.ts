export function toggleFaqIndex(current: readonly number[], clicked: number) {
  return current.includes(clicked) ? current.filter((index) => index !== clicked) : [...current, clicked];
}
