import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";

import { ShowHide } from "components/display";
import { HorizontalMenu } from "components/control/menus";
import { IHorizontalMenuItem } from "components/control/menus/HorizontalMenu";
import { Drawer } from "components/layout";

import { setCommentsHistoryDrawerVisibilityAction } from "../actions";
import CommentsDrawerContent, { CommentsDrawerContentProps } from "./CommentsDrawerContent";
import HistoryDrawerContent from "./HistoryDrawerContent";
import "./index.scss";

type Page = "comments" | "history";

interface CommentsHistoryDrawerProps {
  commentsProps: CommentsDrawerContentProps;
}

const CommentsHistoryDrawer = ({ commentsProps }: CommentsHistoryDrawerProps): JSX.Element => {
  const [page, setPage] = useState<Page>("comments");
  const dispatch: Dispatch = useDispatch();
  const visible = useSelector((state: Redux.IApplicationStore) => state.budget.commentsHistoryDrawerOpen);

  return (
    <Drawer
      className={"comments-history-drawer"}
      visible={visible}
      onClickAway={() => dispatch(setCommentsHistoryDrawerVisibilityAction(false))}
    >
      <HorizontalMenu
        onChange={(item: IHorizontalMenuItem) => setPage(item.id)}
        selected={[page]}
        items={[
          { id: "comments", label: "Comments" },
          { id: "history", label: "History" }
        ]}
      />
      <ShowHide show={page === "comments"}>
        <CommentsDrawerContent {...commentsProps} />
      </ShowHide>
      <ShowHide show={page === "history"}>
        <HistoryDrawerContent />
      </ShowHide>
    </Drawer>
  );
};

export default CommentsHistoryDrawer;
