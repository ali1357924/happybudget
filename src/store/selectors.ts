import { redux } from "lib";

export const selectApplicationLoading = (state: Application.Store) => state.loading;

export const selectContacts = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Store) => state.contacts.data
);

export const selectContactsLoading = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Store) => state.contacts.loading
);

export const selectFilteredContacts = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Authenticated.Store) => state.filteredContacts.data
);

export const selectFilteredContactsLoading = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Authenticated.Store) => state.filteredContacts.loading
);
