import * as services from "./services";

export const getActual = services.retrieveService<Model.Actual>((id: number) => ["actuals", id]);
export const deleteActual = services.deleteService((id: number) => ["actuals", id]);
export const updateActual = services.detailPatchService<Partial<Http.ActualPayload>, Model.Actual>((id: number) => [
  "actuals",
  id
]);
export const getActualAttachments = services.detailListService<Model.Attachment>((id: number) => [
  "actuals",
  id,
  "attachments"
]);
export const deleteActualAttachment = services.detailDeleteService((id: number, objId: number) => [
  "actuals",
  objId,
  "attachments",
  id
]);
export const uploadActualAttachment = services.detailPostService<FormData, { data: Model.Attachment[] }>(
  (id: number) => ["actuals", id, "attachments"]
);

export const getActualTypes = services.listService<Model.Tag>(["actuals", "types"]);
