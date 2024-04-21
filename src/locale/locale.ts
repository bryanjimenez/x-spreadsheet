/* global window */
import en from "./en";

// Defines the fallback language as English
let $languages = ["en"];
const $messages: Record<string, unknown> = {
  en,
};

/**
 * Walks down the language object looking for the value of `key`
 * @param key
 * @param messages
 */
function translate(
  key: string,
  messages: Record<string, unknown>
): string | undefined {
  if (messages) {
    // Return the translation from the first language in the languages array
    // that has a value for the provided key.
    for (const lang of $languages) {
      if (!messages[lang]) break;

      let message = messages[lang];

      // Splits the key at '.' except where escaped as '\.'
      const keys = key.match(/(?:\\.|[^.])+/gu) ?? [];

      for (let i = 0; i < keys.length; i += 1) {
        const property = keys[i];
        const value: string = message[property];

        // If value doesn't exist, try next language
        if (!value) break;

        if (i === keys.length - 1) return value;

        // Move down to the next level of the messages object
        message = value;
      }
    }
  }

  return undefined;
}

/**
 * Translate a `key` (term)
 * @param key
 */
function t(key: string) {
  let v = translate(key, $messages);

  // if (!v && window && 'x_spreadsheet' in window && window.x_spreadsheet.$messages) {
  if (!v && window && window.x_spreadsheet && window.x_spreadsheet.$messages) {
    v = translate(key, window.x_spreadsheet.$messages);
  }
  return v || "";
}

/**
 * Calendar items returns array
 * @param key
 * @returns Array of items
 */
export function ct(key: string) {
  return t(key) as string[];
}

/**
 * Return a translation function for `key`
 * @param key
 */
function tf(key: string) {
  return () => t(key);
}

// If clearLangList is set to false, lang will be added to the front of the
// languages array. The languages in the language array are searched in order
// to find a translation. This allows the use of other languages as a fallback
// if lang is missing some keys. The language array is preloaded with English.
// To set the languages array to only include lang, set clearLangList to true.
function locale(
  lang: string,
  message: Record<string, unknown>,
  clearLangList = false
) {
  if (clearLangList) {
    $languages = [lang];
  } else {
    // Append to front of array.
    // Translation method will use the first language in the list that has a
    // matching key.
    $languages.unshift(lang);
  }

  if (message) {
    $messages[lang] = message;
  }
}

export default {
  t,
};

export { locale, t, tf };
