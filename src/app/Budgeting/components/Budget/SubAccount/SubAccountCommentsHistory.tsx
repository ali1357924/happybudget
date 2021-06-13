import { useDispatch, useSelector } from "react-redux";
import { includes, map } from "lodash";
import { simpleDeepEqualSelector, simpleShallowEqualSelector } from "store/selectors";
import CommentsHistoryDrawer from "../CommentsHistoryDrawer";
import {
  requestCommentsAction,
  createCommentAction,
  deleteCommentAction,
  updateCommentAction,
  requestHistoryAction
} from "../../../store/actions/budget/subAccount";

const selectDeletingComments = simpleDeepEqualSelector((state: Modules.ApplicationStore) =>
  map(state.budgeting.budget.subaccount.comments.deleting, (instance: Redux.ModelListActionInstance) => instance.id)
);
const selectEditingComments = simpleDeepEqualSelector((state: Modules.ApplicationStore) =>
  map(state.budgeting.budget.subaccount.comments.updating, (instance: Redux.ModelListActionInstance) => instance.id)
);

const selectReplyingComments = simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.comments.replying
);
const selectCommentsData = simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.comments.data
);
const selectSubmittingComment = simpleShallowEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.comments.creating
);
const selectLoadingComments = simpleShallowEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.comments.loading
);
const selectLoadingHistory = simpleShallowEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.subaccounts.history.loading
);
const selectHistory = simpleDeepEqualSelector(
  (state: Modules.ApplicationStore) => state.budgeting.budget.subaccount.subaccounts.history.data
);

const SubAccountCommentsHistory = (): JSX.Element => {
  const dispatch = useDispatch();
  const deletingComments = useSelector(selectDeletingComments);
  const editingComments = useSelector(selectEditingComments);
  const replyingComments = useSelector(selectReplyingComments);
  const submittingComment = useSelector(selectSubmittingComment);
  const loadingComments = useSelector(selectLoadingComments);
  const comments = useSelector(selectCommentsData);
  const loadingHistory = useSelector(selectLoadingHistory);
  const history = useSelector(selectHistory);

  return (
    <CommentsHistoryDrawer
      commentsProps={{
        comments: comments,
        loading: loadingComments,
        submitting: submittingComment,
        commentLoading: (comment: Model.Comment) =>
          includes(deletingComments, comment.id) ||
          includes(editingComments, comment.id) ||
          includes(replyingComments, comment.id),
        onRequest: () => dispatch(requestCommentsAction(null)),
        onSubmit: (payload: Http.CommentPayload) => dispatch(createCommentAction({ data: payload })),
        onDoneEditing: (comment: Model.Comment, value: string) =>
          dispatch(updateCommentAction({ id: comment.id, data: { text: value } })),
        onDoneReplying: (comment: Model.Comment, value: string) =>
          dispatch(createCommentAction({ parent: comment.id, data: { text: value } })),
        /* eslint-disable no-console */
        onLike: (comment: Model.Comment) => console.log(comment),
        onDelete: (comment: Model.Comment) => dispatch(deleteCommentAction(comment.id))
      }}
      historyProps={{
        history: history,
        loading: loadingHistory,
        onRequest: () => dispatch(requestHistoryAction(null))
      }}
    />
  );
};

export default SubAccountCommentsHistory;
