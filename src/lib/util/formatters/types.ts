export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Currency<D extends boolean = false> = D extends false
  ? `${number}.${Digit}${Digit}`
  : `$${Currency<false>}`;

export type Percent = `% ${number}.${Digit}${Digit}`;

export type DatePrimitive = string | number | Date;
