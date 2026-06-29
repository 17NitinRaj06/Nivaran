export function sanitizeError(error) {
  if (!error) return 'Something went wrong. Please try again.';
  console.warn('Error:', error.code || '', error.message || error);
  return 'Something went wrong. Please try again.';
}
