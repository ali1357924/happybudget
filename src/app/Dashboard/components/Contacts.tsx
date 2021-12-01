import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { isNil, filter } from "lodash";

import { actions as globalActions } from "store";
import { tabling, redux } from "lib";

import { Page } from "components/layout";
import { useContacts } from "components/hooks";
import { ContactsTable, connectTableToStore } from "components/tabling";

import { actions } from "../store";

type M = Model.Contact;
type R = Tables.ContactRowData;

const ActionMap = {
  tableChanged: actions.handleContactsTableChangeEventAction,
  request: actions.requestContactsAction,
  loading: actions.loadingContactsAction,
  response: actions.responseContactsAction,
  saving: actions.savingContactsTableAction,
  addModelsToState: actions.addContactModelsToStateAction,
  setSearch: actions.setContactsSearchAction,
  clear: actions.clearContactsAction,
  updateRowsInState: actions.updateContactRowsInStateAction
};

const ConnectedContactsTable = connectTableToStore<ContactsTable.Props, R, M, Tables.ContactTableStore>({
  asyncId: "async-contacts-table",
  actions: ActionMap,
  reducer: tabling.reducers.createAuthenticatedTableReducer<R, M, Tables.ContactTableStore>({
    tableId: "contacts-table",
    columns: ContactsTable.Columns,
    actions: ActionMap,
    initialState: redux.initialState.initialTableState
  })
})(ContactsTable.Table);

const Contacts = (): JSX.Element => {
  const table = tabling.hooks.useTable<R, M>();

  const dispatch = useDispatch();

  const onAttachmentRemoved = useMemo(
    () => (row: Table.ModelRow<R>, id: number) =>
      dispatch(
        actions.updateContactRowsInStateAction({
          id: row.id,
          data: {
            attachments: filter(row.data.attachments, (a: Model.SimpleAttachment) => a.id !== id)
          }
        })
      ),
    []
  );

  const onAttachmentAdded = useMemo(
    () => (row: Table.ModelRow<R>, attachment: Model.Attachment) =>
      dispatch(
        actions.updateContactRowsInStateAction({
          id: row.id,
          data: {
            attachments: [
              ...row.data.attachments,
              { id: attachment.id, name: attachment.name, extension: attachment.extension, url: attachment.url }
            ]
          }
        })
      ),
    []
  );

  /* eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars */
  const [__, editContactModal, editContact, _] = useContacts({
    onCreated: (m: Model.Contact) => dispatch(globalActions.authenticated.addContactToStateAction(m)),
    onUpdated: (m: Model.Contact) =>
      table.current.applyTableChange({
        type: "modelUpdated",
        payload: { model: m }
      }),
    onAttachmentRemoved: (id: number, attachmentId: number) => {
      const row = table.current.getRow(id);
      if (!isNil(row)) {
        if (tabling.typeguards.isModelRow(row)) {
          onAttachmentRemoved(row, attachmentId);
        } else {
          console.warn(
            `Suspicous Behavior: After attachment was added, row with ID
            ${id} did not refer to a model row.`
          );
        }
      } else {
        console.warn(
          `Suspicous Behavior: After attachment was added, could not find row in
          state for ID ${id}.`
        );
      }
    },
    onAttachmentAdded: (id: number, m: Model.Attachment) => {
      const row = table.current.getRow(id);
      if (!isNil(row)) {
        if (tabling.typeguards.isModelRow(row)) {
          onAttachmentAdded(row, m);
        } else {
          console.warn(
            `Suspicous Behavior: After attachment was added, row with ID
            ${id} did not refer to a model row.`
          );
        }
      } else {
        console.warn(
          `Suspicous Behavior: After attachment was added, could not find row in
          state for ID ${id}.`
        );
      }
    }
  });

  return (
    <React.Fragment>
      <Page className={"contacts"} title={"My Contacts"}>
        <ConnectedContactsTable
          table={table}
          tableId={"contacts-table"}
          onRowExpand={(row: Table.ModelRow<R>) => editContact(row.id)}
          exportFileName={"contacts"}
          onAttachmentRemoved={onAttachmentRemoved}
          onAttachmentAdded={onAttachmentAdded}
        />
      </Page>
      {editContactModal}
    </React.Fragment>
  );
};

export default Contacts;
