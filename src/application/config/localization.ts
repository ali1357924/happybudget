/* eslint-disable-next-line no-restricted-imports -- This is a special case to avoid circular imports. */
import { enumeratedLiterals } from "lib/util/literals";
/* eslint-disable-next-line no-restricted-imports -- This is a special case to avoid circular imports. */
import { EnumeratedLiteralType } from "lib/util/types";

export const DateLocalizationCodes = enumeratedLiterals(["DISPLAY", "API"] as const);
export type DateLocalizationCode = EnumeratedLiteralType<typeof DateLocalizationCodes>;

export const TimeLocalizationCodes = enumeratedLiterals(["DISPLAY"] as const);
export type TimeLocalizationCode = EnumeratedLiteralType<typeof TimeLocalizationCodes>;

export const DateTimeLocalizationCodes = enumeratedLiterals([
  "ABBREVIATED",
  "DISPLAY",
  "API",
] as const);
export type DateTimeLocalizationCode = EnumeratedLiteralType<typeof DateTimeLocalizationCodes>;

export const DateLocalizations = {
  [DateLocalizationCodes.DISPLAY]: "MM/DD/YYYY" as const,
  [DateLocalizationCodes.API]: "YYYY-MM-DD" as const,
};

export type DateLocalization = typeof DateLocalizations[keyof typeof DateLocalizations];

export const TimeLocalizations = {
  [TimeLocalizationCodes.DISPLAY]: "hh:mm A" as const,
};

export type TimeLocalization = typeof TimeLocalizations[keyof typeof TimeLocalizations];

export const DateTimeLocalizations = {
  [DateTimeLocalizationCodes.DISPLAY]: "MMM D, YYYY h:mm:ss A" as const,
  [DateTimeLocalizationCodes.ABBREVIATED]: "lll" as const,
  [DateTimeLocalizationCodes.API]: "YYYY-MM-DD HH:mm:ss" as const,
};

export type DateTimeLocalization = typeof DateTimeLocalizations[keyof typeof DateTimeLocalizations];

export const LocalizationTypes = enumeratedLiterals(["time", "date", "datetime"] as const);
export type LocalizationType = EnumeratedLiteralType<typeof LocalizationTypes>;

export type Localizations = {
  date: typeof DateLocalizations & Record<DateLocalizationCode, string>;
  time: typeof TimeLocalizations & Record<TimeLocalizationCode, string>;
  datetime: typeof DateTimeLocalizations & Record<DateTimeLocalizationCode, string>;
};

export type LocalizationCodes = { [key in LocalizationType]: keyof Localizations[key] };

export const AllLocalizations: Localizations = {
  date: DateLocalizations,
  time: TimeLocalizations,
  datetime: DateTimeLocalizations,
};

export const getLocalization = <T extends LocalizationType, C extends LocalizationCodes[T]>(
  type: T,
  code: C,
): Localizations[T][C] & string => AllLocalizations[type][code] as Localizations[T][C] & string;
