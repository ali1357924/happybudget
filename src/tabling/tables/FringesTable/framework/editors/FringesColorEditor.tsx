import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { useSelector } from "react-redux";

import { ColorGrid } from "components/tagging";
import { ui } from "lib";

const KEY_BACKSPACE = 8;
const KEY_DELETE = 46;

interface FringesColorEditorProps
  extends Table.EditorParams<Tables.FringeRowData, Model.Fringe, Tables.FringeTableStore> {
  value: string | null;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const FringesColorEditor = (props: FringesColorEditorProps, ref: any) => {
  const isFirstRender = ui.hooks.useTrackFirstRender();
  const [value, setValue] = useState<string | null>(props.value);
  const colors = useSelector((state: Application.AuthenticatedStore) => props.selector(state).fringeColors);

  useEffect(() => {
    if (!isFirstRender) {
      props.stopEditing();
    }
  }, [value]);

  useImperativeHandle(ref, () => {
    return {
      getValue: () => {
        return value;
      },
      isCancelBeforeStart() {
        return props.keyPress === KEY_BACKSPACE || props.keyPress === KEY_DELETE;
      },
      isCancelAfterEnd() {
        return false;
      }
    };
  });

  return <ColorGrid colors={colors} value={value} onChange={(v: string) => setValue(v)} />;
};

export default forwardRef(FringesColorEditor);
