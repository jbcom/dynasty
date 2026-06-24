declare module "text-readability" {
  interface TextReadability {
    sentenceCount(text: string): number;
    lexiconCount(text: string, removePunctuation?: boolean): number;
    fleschReadingEase(text: string): number;
    fleschKincaidGrade(text: string): number;
    gunningFog(text: string): number;
    automatedReadabilityIndex(text: string): number;
    difficultWords(text: string): number;
    textStandard(text: string, floatOutput?: boolean): string | number;
  }

  const textReadability: TextReadability;
  export default textReadability;
}
