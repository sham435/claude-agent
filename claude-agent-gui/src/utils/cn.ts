export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes
    .filter((c) => typeof c === 'string')
    .join(' ');
}