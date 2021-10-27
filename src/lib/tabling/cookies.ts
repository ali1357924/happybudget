import { includes, isNil, reduce } from "lodash";
import Cookies from "universal-cookie";

export const parseHiddenColumns = <R extends Table.RowData>(
  obj: any,
  validateAgainst?: (keyof R | string)[]
): Table.HiddenColumns => {
  let data: any = null;
  if (typeof obj === "string") {
    try {
      data = JSON.parse(obj);
    } catch (e) {
      if (!(e instanceof SyntaxError)) {
        throw e;
      }
      return {};
    }
  } else if (typeof obj === "object") {
    data = obj;
  }
  if (!isNil(data)) {
    const cols = Object.keys(data);
    return reduce(
      cols,
      (curr: { [key: string]: boolean }, c: string) => {
        if (isNil(validateAgainst) || includes(validateAgainst, c)) {
          if (typeof data[c] === "boolean") {
            return { ...curr, [c]: data[c] };
          }
        }
        return { ...curr };
      },
      {}
    );
  }
  return {};
};

export const getHiddenColumns = (cookieName: string, validateAgainst?: string[]): Table.HiddenColumns => {
  const cookiesObj = new Cookies();
  const cookiesHiddenColumns = cookiesObj.get(cookieName);
  return parseHiddenColumns(cookiesHiddenColumns, validateAgainst);
};

export const setHiddenColumns = (cookieName: string, fields: Table.HiddenColumns) => {
  const cookiesObj = new Cookies();
  cookiesObj.set(cookieName, fields);
};
