export function format(text, ...params) {
  if (!text) {
    return text;
  }

  text = text.replace(/%%/g, '%');
  for (const replacement of params) {
    text = text.replace('%s', replacement);
  }

  return text;
}
