export function WorkWriteup({ text, className = "" }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return (
    <div className={`space-y-4 font-serif text-lg leading-relaxed ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={paragraph.startsWith("“") ? "italic" : undefined}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
