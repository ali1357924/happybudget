import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Dispatch } from "redux";

import { SearchInput } from "components/fields";
import { Button } from "components/buttons";
import { CreateContactModal } from "components/modals";
import { ActionsMenuBar } from "components/menus";
import { Page } from "components/layout";

import { setContactsSearchAction } from "store/actions";
import ContactsTable from "./ContactsTable";

const Contacts = (): JSX.Element => {
  const [newContactModalOpen, setNewContactModalOpen] = useState(false);
  const dispatch: Dispatch = useDispatch();
  const contacts = useSelector((state: Modules.ApplicationStore) => state.user.contacts);

  return (
    <React.Fragment>
      <Page className={"contacts"} title={"My Contacts"}>
        <ActionsMenuBar className={"mb--15"}>
          <SearchInput
            placeholder={"Search Contacts"}
            value={contacts.search}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              dispatch(setContactsSearchAction(event.target.value))
            }
          />
          <Button className={"btn btn--primary"} onClick={() => setNewContactModalOpen(true)}>
            {"Add Contact"}
          </Button>
        </ActionsMenuBar>
        <ContactsTable />
      </Page>
      <CreateContactModal
        visible={newContactModalOpen}
        onCancel={() => setNewContactModalOpen(false)}
        onSuccess={() => setNewContactModalOpen(false)}
      />
    </React.Fragment>
  );
};

export default Contacts;
