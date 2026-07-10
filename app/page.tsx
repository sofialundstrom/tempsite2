import ScatteredText from "./scattered-text";

const constructionLine1 = "SIDAN ÄR UNDER";
const constructionLine2 = "KONSTRUKTION";

const constructionClassName =
  "glitch text-2xl leading-tight text-[#f9ea38] tracking-[0.03em] sm:text-3xl sm:tracking-[0.05em] md:text-4xl lg:text-5xl";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <ScatteredText />
      </div>

      <div className="fixed inset-0 z-10 flex items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <div className={constructionClassName} data-text={constructionLine1}>
            {constructionLine1}
          </div>
          <div className={constructionClassName} data-text={constructionLine2}>
            {constructionLine2}
          </div>
        </div>
      </div>
    </main>
  );
}
