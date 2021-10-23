import React, { useMemo } from "react";
import classNames from "classnames";
import { isNil, map } from "lodash";

import { DEFAULT_TAG_COLOR_SCHEME, Colors } from "style/constants";
import { model, util, tabling } from "lib";

const TagRenderer = <S extends object = React.CSSProperties>(params: ITagRenderParams<S>): JSX.Element => {
  const { contentRender, ...rest } = params;
  return (
    <div
      className={classNames(
        "tag",
        { uppercase: params.uppercase },
        { "fill-width": params.fillWidth },
        { disabled: params.disabled },
        params.className
      )}
      style={{ ...params.style, backgroundColor: params.color, color: params.textColor }}
      onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => !params.disabled && params.onClick?.(e)}
    >
      {!isNil(contentRender) ? (
        contentRender(rest)
      ) : (
        <span className={params.textClassName} style={params.textStyle}>
          {params.text}
        </span>
      )}
    </div>
  );
};

const isVisibleEmptyTagProps = (
  props: VisibleEmptyTagProps | InvisibleEmptyTagProps
): props is VisibleEmptyTagProps => {
  return (props as InvisibleEmptyTagProps).visible !== false;
};

export const EmptyTag: React.FC<EmptyTagProps> = (props: EmptyTagProps) => {
  return (
    <Tag style={{ ...props.style, opacity: isVisibleEmptyTagProps(props) ? 1 : 0 }}>
      {isVisibleEmptyTagProps(props) ? props.text : "None"}
    </Tag>
  );
};

const Tag = <M extends Model.Model = Model.Model, S extends object = React.CSSProperties>(
  props: TagProps<M, S>
): JSX.Element => {
  const colorScheme = useMemo(() => {
    let tagColorScheme = DEFAULT_TAG_COLOR_SCHEME;
    if (!isNil(props.scheme)) {
      tagColorScheme = props.scheme;
    }
    return tagColorScheme;
  }, [props.scheme]);

  const tagText = useMemo((): string | M[keyof M] => {
    const getTextFromModel = (m: M): string | M[keyof M] => {
      if (!isNil(props.modelTextField)) {
        const modelTextFieldValue = util.getKeyValue<M, keyof M>(props.modelTextField)(m);
        if (!isNil(modelTextFieldValue) && typeof modelTextFieldValue !== "string") {
          console.error(`The field ${props.modelTextField} did not return a string.`);
          return "";
        }
        return modelTextFieldValue || "";
      } else if (!isNil(props.getModelText)) {
        const text = props.getModelText(m);
        if (!isNil(text)) {
          return text;
        }
      }
      if (model.typeguards.isTag(m)) {
        if (props.isPlural === true && !isNil(m.plural_title)) {
          return m.plural_title;
        }
        return m.title;
      } else if (model.typeguards.isModelWithName(m)) {
        return m.name || "";
      } else if (tabling.typeguards.isRow(m) && tabling.typeguards.isRowWithName(m)) {
        return m.data.name || "";
      }
      return "";
    };
    if (props.isPlural === true && !isNil(props.pluralText)) {
      return props.pluralText;
    } else if (!isNil(props.text)) {
      return props.text;
    } else if (!isNil(props.children)) {
      if (typeof props.children === "string") {
        return props.children;
      }
      return getTextFromModel(props.children);
    } else if (!isNil(props.model)) {
      return getTextFromModel(props.model);
    }
    return "";
  }, [props]);

  const tagColor = useMemo((): Style.HexColor => {
    const validateAndReturnColor = (color: Style.HexColor | null | undefined, field: string): Style.HexColor => {
      if (isNil(color)) {
        return Colors.DEFAULT_TAG_BACKGROUND;
      } else if (typeof color !== "string") {
        console.error(`The field ${field} did not return a string color.`);
        return Colors.DEFAULT_TAG_BACKGROUND;
      }
      if (!color.startsWith("#")) {
        color = `#${color}`;
      }
      if (color.length !== 7) {
        console.error(`The field ${field} did not return a valid HEX string color.`);
        return Colors.DEFAULT_TAG_BACKGROUND;
      }
      return color;
    };
    const getColorFromModel = (m: M): Style.HexColor => {
      if (!isNil(props.modelColorField)) {
        const modelColorFieldValue: unknown = m[props.modelColorField];
        return validateAndReturnColor(modelColorFieldValue as Style.HexColor, props.modelColorField as string);
      } else if (!isNil(props.getModelColor)) {
        const color = props.getModelColor(m);
        if (!isNil(color)) {
          return validateAndReturnColor(color, "getModelColor callback");
        }
      }
      if (model.typeguards.isTag(m)) {
        return validateAndReturnColor(m.color, "color");
      } else if (model.typeguards.isModelWithColor(m)) {
        return validateAndReturnColor(m.color, "color");
      } else if (tabling.typeguards.isRow(m) && tabling.typeguards.isRowWithColor(m) && !isNil(m.data.color)) {
        return m.data.color;
      } else if (typeof m.id === "number" && !isNil(colorScheme[m.id])) {
        return colorScheme[m.id];
      }
      return Colors.DEFAULT_TAG_BACKGROUND;
    };
    if (!isNil(props.color)) {
      return validateAndReturnColor(props.color, "color");
    } else if (!isNil(props.children) && typeof props.children !== "string") {
      return getColorFromModel(props.children);
    } else if (!isNil(props.model)) {
      return getColorFromModel(props.model);
    } else if (!isNil(props.colorIndex)) {
      if (!isNil(colorScheme[props.colorIndex])) {
        return colorScheme[props.colorIndex];
      }
      return Colors.DEFAULT_TAG_BACKGROUND;
    }
    return util.selectConsistent(colorScheme, tagText as string);
  }, [props]);

  const tagTextColor = useMemo(() => {
    if (!isNil(props.textColor)) {
      return props.textColor;
    }
    return util.colors.contrastedForegroundColor(tagColor);
  }, [tagColor, props]);

  const renderParams = useMemo<ITagRenderParams<S>>(() => {
    return {
      className: props.className,
      uppercase: props.uppercase || false,
      color: tagColor,
      textColor: tagTextColor,
      text: tagText as string,
      fillWidth: props.fillWidth || false,
      style: props.style,
      textStyle: props.textStyle,
      textClassName: props.textClassName,
      contentRender: props.contentRender,
      onClick: props.onClick,
      disabled: props.disabled
    };
  }, [
    props.className,
    props.textClassName,
    props.style,
    props.textStyle,
    props.uppercase,
    tagColor,
    tagTextColor,
    tagText,
    props.fillWidth
  ]);

  if (!isNil(props.render)) {
    return props.render(renderParams);
  }
  return <TagRenderer<S> {...renderParams} />;
};

const isEmptyTagsPropsNotComponent = (props: EmptyTagProps | JSX.Element): props is EmptyTagProps => {
  return typeof props === "object";
};

const emptyTagPropsOrComponent = (props: JSX.Element | EmptyTagProps): JSX.Element => {
  return isEmptyTagsPropsNotComponent(props) ? <EmptyTag {...props} /> : props;
};

const isPluralityWithModel = <M extends Model.Model = Model.Model>(
  m: M | PluralityWithModel<M>
): m is PluralityWithModel<M> => (m as PluralityWithModel<M>).model !== undefined;

/**
 * Group of <Tag> components that overlap to a certain degree.
 *
 * This component can be created in 3 different ways:
 *
 * (1) Explicitly Provided ITag Objects:
 *     <MultipleTags tags={[{ text: "foo", color: "red" }, { text: "bar", color: "blue" }]} />
 *
 * (2) Provided Model (M) Objects:
 *     <MultipleTags models={[ {...}, {...} ]} modelColorField={"color"} modelTextField={"name"}]} />
 *
 * (3) Children <Tag> Components:
 *     <MultipleTags><Tag /><Tag /></MultipleTags>
 */
export const MultipleTags = <M extends Model.Model = Model.Model>(props: MultipleTagsProps<M>): JSX.Element => {
  return (
    <div className={classNames("multiple-tags-wrapper", props.className)} style={props.style}>
      {!isNil(props.models) ? (
        /* eslint-disable indent */
        props.models.length !== 0 || isNil(props.onMissing) ? (
          map(props.models, (m: M | PluralityWithModel<M>, index: number) => {
            return (
              <Tag
                key={index}
                {...props.tagProps}
                model={isPluralityWithModel(m) ? m.model : m}
                isPlural={isPluralityWithModel(m) ? m.isPlural : props.tagProps?.isPlural}
              />
            );
          })
        ) : (
          emptyTagPropsOrComponent(props.onMissing)
        )
      ) : !isNil(props.tags) ? (
        props.tags.length !== 0 || isNil(props.onMissing) ? (
          map(props.tags, (tag: ITag, index: number) => {
            // For each object, ITag, in the series, the ITag object can explicitly set the color,
            // textColor and uppercase setting for that created <Tag>.  However, these fields are
            // optional for each specific ITag, and if not set on any given individual ITag object,
            // can be applied to all created <Tag> components based on the textColor, color and
            // uppercase setting supplied globally as props to this MultipleTags component.
            return (
              <Tag
                key={index}
                text={tag.text}
                {...props.tagProps}
                color={!isNil(tag.color) ? tag.color : props.tagProps?.color}
                textColor={!isNil(tag.textColor) ? tag.textColor : props.tagProps?.textColor}
                uppercase={!isNil(tag.uppercase) ? tag.uppercase : props.tagProps?.uppercase}
                colorIndex={index}
              />
            );
          })
        ) : isEmptyTagsPropsNotComponent(props.onMissing) ? (
          <EmptyTag {...props.onMissing} />
        ) : (
          props.onMissing
        )
      ) : (
        !isNil(props.children) &&
        (props.children.length !== 0 || isNil(props.onMissing)
          ? props.children
          : emptyTagPropsOrComponent(props.onMissing))
      )}
    </div>
  );
};

Tag.emptyTagPropsOrComponent = emptyTagPropsOrComponent;
Tag.Empty = EmptyTag;
Tag.Multiple = MultipleTags;
export default Tag;
