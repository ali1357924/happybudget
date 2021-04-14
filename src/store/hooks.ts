import { useSelector } from "react-redux";
import { isNil } from "lodash";

export const useLoggedInUser = (): Model.User => {
  const value = useSelector((state: Redux.ApplicationStore) => {
    return state.user;
  });
  return value;
};

export const useTimezone = (options: { defaultTz?: string | undefined } = {}): string => {
  const defaultTimezone = !isNil(options.defaultTz) ? options.defaultTz : "America/New_York";
  const value = useSelector((state: Redux.ApplicationStore) => {
    return !isNil(state.user.timezone) ? state.user.timezone : defaultTimezone;
  });
  return value;
};
