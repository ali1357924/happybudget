import React, { useImperativeHandle, useCallback, useState, useRef, useEffect } from "react";
import { isNil, get } from "lodash";

import classNames from "classnames";
import { Input } from "antd";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/pro-light-svg-icons";

import { isCharacterKeyPress, isBackspaceKeyPress } from "lib/util/events";

import { ExpandedModelMenuRef, ModelMenuRef, ExpandedModelMenuProps } from "./model";
import ModelMenu from "./ModelMenu";
import "./ExpandedModelMenu.scss";

const ExpandedModelMenu = <M extends Model.M>({
  className,
  style,
  search,
  menuRef,
  focusSearchOnCharPress,
  onSearch,
  ...props
}: ExpandedModelMenuProps<M>): JSX.Element => {
  const [_search, _setSearch] = useState("");
  const _menuRef = useRef<ModelMenuRef<M>>(null);
  const searchRef = useRef<Input>(null);

  const getFromMenuRef = useCallback(
    (getter: string, notSet: any): any => {
      if (!isNil(_menuRef.current)) {
        return get(_menuRef.current, getter);
      }
      return notSet;
    },
    [menuRef]
  );

  const getModelAtMenuFocusedIndex = () => {
    if (!isNil(_menuRef.current)) {
      return _menuRef.current.getModelAtFocusedIndex();
    }
    return null;
  };

  const performActionAtMenuFocusedIndex = () => {
    if (!isNil(_menuRef.current)) {
      return _menuRef.current.performActionAtFocusedIndex();
    }
  };

  const setSearch = (value: string) => {
    _setSearch(value);
    if (!isNil(onSearch)) {
      onSearch(value);
    }
  };

  const focusSearch = (value: boolean, searchValue?: string, timeout?: number) => {
    const searchInput = searchRef.current;
    if (!isNil(searchInput)) {
      if (value === true) {
        setTimeout(() => {
          searchInput.focus();
        }, timeout || 25);
        if (!isNil(searchValue)) {
          setSearch(searchValue);
        }
      } else {
        searchInput.blur();
        searchInput.setState({ focused: false });
      }
    }
  };

  useImperativeHandle(
    menuRef,
    (): ExpandedModelMenuRef<M> => ({
      menuFocused: getFromMenuRef("focused", false),
      getModelAtMenuFocusedIndex: getModelAtMenuFocusedIndex,
      performActionAtMenuFocusedIndex: performActionAtMenuFocusedIndex,
      incrementMenuFocusedIndex: () => {
        !isNil(_menuRef.current) && _menuRef.current.incrementFocusedIndex();
      },
      decrementMenuFocusedIndex: () => {
        !isNil(_menuRef.current) && _menuRef.current.decrementFocusedIndex();
      },
      focusMenu: (value: boolean) => {
        !isNil(_menuRef.current) && _menuRef.current.focus(value);
      },
      focusSearch: focusSearch
    })
  );

  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (isCharacterKeyPress(e) || isBackspaceKeyPress(e)) {
        const searchInput = searchRef.current;
        const menuRefObj = _menuRef.current;
        if (!isNil(menuRefObj)) {
          menuRefObj.focus(false);
        }
        if (!isNil(searchInput)) {
          if (searchInput.state.focused === false) {
            searchInput.focus();
          }
        }
      } else if (e.code === "ArrowDown") {
        e.stopPropagation();
        const menuRefObj = _menuRef.current;
        if (!isNil(menuRefObj)) {
          menuRefObj.focus(true);
        }
      }
    };
    window.addEventListener("keydown", keyListener);
    return () => window.removeEventListener("keydown", keyListener);
  }, []);

  return (
    <div className={classNames("expanded-model-menu", className)} style={style}>
      <div className={"search-container"}>
        <Input
          className={"input--small"}
          placeholder={props.searchPlaceholder || "Search"}
          autoFocus={true}
          value={isNil(search) ? _search : search}
          ref={searchRef}
          onFocus={() => {
            const menuRefObj = _menuRef.current;
            if (!isNil(menuRefObj)) {
              menuRefObj.focus(false);
            }
          }}
          prefix={<FontAwesomeIcon className={"icon"} icon={faSearch} />}
          allowClear={true}
          style={{ maxWidth: 300, minWidth: 100 }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(event.target.value);
          }}
        />
      </div>
      {!isNil(props.children) ? (
        props.children
      ) : (
        <ModelMenu<M>
          {...props}
          {...props.menuProps}
          loading={props.menuLoading}
          search={isNil(search) ? _search : search}
          menuRef={_menuRef}
          onFocusCallback={(focused: boolean) => focusSearch(!focused)}
        />
      )}
    </div>
  );
};

export default ExpandedModelMenu;