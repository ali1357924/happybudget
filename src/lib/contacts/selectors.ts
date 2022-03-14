import * as redux from "../redux";

export const selectContacts = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Store) => state.contacts.data
);

export const selectContactsLoaded = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Store) => state.contacts.responseWasReceived
);

export const selectContactsLoading = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Store) => state.contacts.loading
);

export const selectFilteredContacts = redux.selectors.simpleDeepEqualSelector(
  (state: Application.Store) => state.filteredContacts.data
);

export const selectFilteredContactsLoading = redux.selectors.simpleShallowEqualSelector(
  (state: Application.Store) => state.filteredContacts.loading
);
