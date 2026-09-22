export function generateFakeResponse(): string[] {
  return Array.from({ length: 30 }, (_, index) => {
    return `Generated response event ${index + 1}`;
  });
}