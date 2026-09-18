/**
 * Phone Number Detection & Compliance Filter
 * Detects phone numbers spoken during calls or sent in in-call messages.
 * Supports:
 * - Direct numeric digits (e.g. "9847654321", "+91 9847654321", "9847-654-321", "9 8 4 7 6 5 4 3 2 1")
 * - Spoken digit words (e.g. "nine eight four seven six five four three two one")
 * - Prefixed repetitions ("double nine", "triple eight")
 * - Regional digit words (Hindi: "ek, do, teen", Malayalam: "onnu, randu, moonnu", etc.)
 * - Sliding window chunk detection for paused speech
 * - Intent phrases followed by numbers ("call me on 9847...", "my number is...")
 */

const DIGIT_WORDS = {
  // English
  'zero': '0',
  'oh': '0',
  'o': '0',
  'one': '1',
  'two': '2',
  'to': '2',
  'too': '2',
  'three': '3',
  'tree': '3',
  'four': '4',
  'for': '4',
  'fore': '4',
  'five': '5',
  'six': '6',
  'seven': '7',
  'eight': '8',
  'ate': '8',
  'nine': '9',

  // Hindi transliterated
  'shunya': '0',
  'ek': '1',
  'ik': '1',
  'do': '2',
  'teen': '3',
  'tin': '3',
  'chaar': '4',
  'char': '4',
  'paanch': '5',
  'panch': '5',
  'chhah': '6',
  'chhe': '6',
  'che': '6',
  'saat': '7',
  'sat': '7',
  'aath': '8',
  'ath': '8',
  'nau': '9',
  'no': '9',

  // Malayalam transliterated
  'poojyam': '0',
  'onnu': '1',
  'randu': '2',
  'rand': '2',
  'moonnu': '3',
  'moonu': '3',
  'naalu': '4',
  'nalu': '4',
  'anchu': '5',
  'anju': '5',
  'aaru': '6',
  'aru': '6',
  'ezhu': '7',
  'elu': '7',
  'ettu': '8',
  'onpathu': '9',
  'ombathu': '9',
};

const INTENT_KEYWORDS = [
  'call',
  'call me',
  'whatsapp',
  'whats app',
  'phone',
  'mobile',
  'number',
  'no',
  'contact',
  'dial',
  'reach me',
  'ping me',
  'message me',
  'gpay',
  'paytm',
  'phonepe',
];

/**
 * Normalizes speech/chat text by converting word numbers, handling double/triple prefixes,
 * and extracting potential digit sequences.
 */
export const normalizeSpokenNumbers = (rawText = '') => {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText.toLowerCase();

  // 1. Handle "double <digit|word>" -> e.g. "double nine" -> "nine nine"
  text = text.replace(/\bdouble\s+([a-z0-9]+)\b/g, (match, word) => {
    return `${word} ${word}`;
  });

  // 2. Handle "triple <digit|word>" -> e.g. "triple eight" -> "eight eight eight"
  text = text.replace(/\btriple\s+([a-z0-9]+)\b/g, (match, word) => {
    return `${word} ${word} ${word}`;
  });

  // 3. Convert word digits to numeric digits
  const tokens = text.split(/[\s,.-]+/);
  const convertedTokens = tokens.map((token) => {
    if (DIGIT_WORDS[token] !== undefined) {
      return DIGIT_WORDS[token];
    }
    return token;
  });

  return convertedTokens.join(' ');
};

/**
 * Extracts continuous or spaced numeric digit sequences from normalized text.
 */
export const extractDigitSequences = (normalizedText = '') => {
  if (!normalizedText) return [];

  // Match sequences where digits might be separated by single spaces, dots, dashes, or slashes
  // e.g. "9 8 4 7 6 5 4 3 2 1" or "9847-654-321" or "9847654321"
  const matches = normalizedText.match(/(?:\+?\d[\s.,\-_/()]*){5,}/g) || [];
  return matches.map((m) => m.replace(/\D/g, ''));
};

/**
 * Core phone number checker.
 * Returns { detected: boolean, reason?: string, match?: string }
 */
export const checkPhoneNumber = (rawInput = '') => {
  if (!rawInput || typeof rawInput !== 'string') {
    return { detected: false };
  }

  const cleanInput = rawInput.trim();
  if (!cleanInput) return { detected: false };

  // 1. Check raw string for standard phone regex patterns
  // Standard Indian 10-digit mobile (starts with 6-9, optional country code +91 or 0)
  const indianPhoneRegex = /(?:(?:\+|0{0,2})91[\s.-]?)?[6-9]\d{9}\b/;
  const rawIndianMatch = cleanInput.match(indianPhoneRegex);
  if (rawIndianMatch) {
    return {
      detected: true,
      reason: 'indian_mobile_format',
      match: rawIndianMatch[0],
    };
  }

  // General 10-15 digit phone sequence
  const generalPhoneRegex = /\b\d{10,15}\b/;
  const rawGeneralMatch = cleanInput.match(generalPhoneRegex);
  if (rawGeneralMatch) {
    return {
      detected: true,
      reason: 'direct_phone_digits',
      match: rawGeneralMatch[0],
    };
  }

  // 2. Normalize spoken words and prefixes
  const normalized = normalizeSpokenNumbers(cleanInput);

  // Check Indian mobile pattern on normalized text
  const normIndianMatch = normalized.match(indianPhoneRegex);
  if (normIndianMatch) {
    return {
      detected: true,
      reason: 'spoken_indian_mobile',
      match: normIndianMatch[0],
    };
  }

  // 3. Extract digit sequences from normalized string
  const digitSequences = extractDigitSequences(normalized);
  const lowerNorm = normalized.toLowerCase();
  const hasIntent = INTENT_KEYWORDS.some((kw) => lowerNorm.includes(kw));

  for (const seq of digitSequences) {
    // A. 5 or more consecutive digits -> Instant cutoff before whole number can be spoken!
    if (seq.length >= 5) {
      return {
        detected: true,
        reason: hasIntent ? 'intent_with_digits' : 'consecutive_digits_5_plus',
        match: seq,
      };
    }

    // B. 3 or 4 digits preceded or followed by intent keyword (e.g. "call me 984", "my number 9847") -> Instant cutoff!
    if (seq.length >= 3 && hasIntent) {
      return {
        detected: true,
        reason: 'intent_with_partial_phone',
        match: seq,
      };
    }
  }

  return { detected: false };
};

/**
 * Sliding Window Speech Detector for paused or chunked speech utterances.
 * Maintains history for 12 seconds to detect when a user pauses between parts of a number.
 */
export class SpeechPhoneDetector {
  constructor(windowMs = 12000) {
    this.windowMs = windowMs;
    this.buffer = []; // Array of { text: string, timestamp: number }
  }

  reset() {
    this.buffer = [];
  }

  feedTranscript(text) {
    if (!text || typeof text !== 'string') return { detected: false };

    const now = Date.now();
    this.buffer.push({ text: text.trim(), timestamp: now });

    // Evict entries older than windowMs
    this.buffer = this.buffer.filter((item) => now - item.timestamp < this.windowMs);

    // 1. Check current individual utterance
    const immediateCheck = checkPhoneNumber(text);
    if (immediateCheck.detected) {
      return immediateCheck;
    }

    // 2. Check cumulative utterance across recent window
    const combinedText = this.buffer.map((item) => item.text).join(' ');
    const combinedCheck = checkPhoneNumber(combinedText);
    if (combinedCheck.detected) {
      return {
        detected: true,
        reason: 'cumulative_speech_window',
        match: combinedCheck.match,
      };
    }

    return { detected: false };
  }
}

/**
 * Masks any detected phone number in text for safe display.
 */
export const maskPhoneNumbers = (text = '') => {
  if (!text || typeof text !== 'string') return text;

  // Mask numeric sequences of 7 to 15 digits
  return text.replace(/(?:\+?91[\s.-]?)?[6-9]\d{9}/g, '[🛡️ Phone number blocked]')
             .replace(/\b\d{7,15}\b/g, '[🛡️ Phone number blocked]');
};
