// HTML pattern attributes (browsers compile these with the `v` flag, so `-` is escaped inside classes)
export const PHONE = { pattern: "(\\+?91[\\s\\-]?|0)?[6-9][0-9]{4}[\\s\\-]?[0-9]{5}", title: "10-digit Indian mobile number, e.g. 98450 12345", inputMode: "tel" as const };
export const PASSWORD = { pattern: "(?=.*[A-Za-z])(?=.*[0-9]).{8,}", title: "At least 8 characters, with a letter and a number", minLength: 8 };
export const PERSON = { pattern: "\\p{L}[\\p{L}\\p{M} .'\\-]*", title: "Letters, spaces and . ' - only", minLength: 2 };
export const ORG = { pattern: "[\\p{L}\\p{N}][\\p{L}\\p{M}\\p{N} .'&(),\\-]*", title: "Letters, numbers, spaces and . ' & ( ) , - only", minLength: 2 };
