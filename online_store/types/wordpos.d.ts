declare module 'wordpos' {
  interface POSResult {
    nouns: string[];
    verbs: string[];
    adjectives: string[];
    adverbs: string[];
    rest: string[];
  }

  type Callback<T> = (result: T) => void;

  class WordPOS {
    constructor(options?: { [key: string]: any });

    getPOS(text: string, callback: Callback<POSResult>): void;
    getNouns(text: string, callback: Callback<string[]>): void;
    getVerbs(text: string, callback: Callback<string[]>): void;
    getAdjectives(text: string, callback: Callback<string[]>): void;
    getAdverbs(text: string, callback: Callback<string[]>): void;

    isNoun(word: string, callback: Callback<boolean>): void;
    isVerb(word: string, callback: Callback<boolean>): void;
    isAdjective(word: string, callback: Callback<boolean>): void;
    isAdverb(word: string, callback: Callback<boolean>): void;
  }

  export = WordPOS;
}
