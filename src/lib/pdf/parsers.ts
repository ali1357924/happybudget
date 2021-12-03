import { isNil, includes, reduce, map, uniq, filter } from "lodash";

import * as typeguards from "./typeguards";

export const convertTagsToFontStyles = (tags: Pdf.SupportedFontStyleTag[]): Pdf.FontStyleName[] => {
  return reduce(
    typeguards.SupportedPdfFontStyles,
    (names: Pdf.FontStyleName[], style: Pdf.SupportedFontStyle) => {
      if (includes(tags, style.tag)) {
        return uniq([...names, style.name]);
      }
      return names;
    },
    []
  );
};

export const cleanText = (text: string) => {
  return text.replace("\n", "").trim();
};

export const removeWhitespace = (node: Node) => {
  for (var i = node.childNodes.length; i-- > 0; ) {
    const child = node.childNodes[i];
    if (!isNil(child.nodeValue) && child.nodeType === 3 && child.nodeValue.match(/^\s*$/)) {
      node.removeChild(child);
    }
    if (child.nodeType === 1) {
      removeWhitespace(child);
    }
  }
};

export const isSupportedNode = (node: Node): boolean => {
  if (node.nodeType !== node.ELEMENT_NODE) {
    throw new Error("Node is not an element node!");
  }
  return typeguards.isSupportedTag(node.nodeName);
};

export const removeUnsupportedNodes = (element: Node): Node[] => {
  const _prune = (node: Node) => {
    if (node.nodeType === node.ELEMENT_NODE) {
      let newNodes: Node[] = reduce(
        node.childNodes,
        (curr: Node[], child: Node) => {
          _prune(child);
          if (child.childNodes.length !== 0) {
            if (child.nodeType === node.ELEMENT_NODE && !isSupportedNode(child)) {
              if (child.childNodes.length !== 0) {
                return [
                  ...curr,
                  ...filter(
                    child.childNodes,
                    (n: Node) => n.nodeType !== Node.ELEMENT_NODE || n.childNodes.length !== 0
                  )
                ];
              } else if (child.nodeType === Node.TEXT_NODE) {
                return [...curr, child];
              }
              return curr;
            }
            return [...curr, child];
          } else if (child.nodeType === Node.TEXT_NODE) {
            return [...curr, child];
          }
          return curr;
        },
        []
      );
      node.childNodes.forEach((child: Node) => node.removeChild(child));
      map(Array.isArray(newNodes) ? newNodes : [newNodes], (child: Node) => node.appendChild(child));
    }
  };
  _prune(element);
  if (element.nodeType === element.ELEMENT_NODE && isSupportedNode(element)) {
    return [element];
  }
  return map(element.childNodes, (n: Node) => n);
};

export const structuredNodeType = (node: Node): Pdf.HTMLNodeType => {
  if (node.nodeType === Node.TEXT_NODE) {
    return "text";
  } else {
    const tag = node.nodeName.toLocaleLowerCase() as Pdf.SupportedHTMLTag;
    if (typeguards.isParagraphTag(tag)) {
      return "paragraph";
    } else if (typeguards.isHeaderTag(tag)) {
      return "header";
    } else if (typeguards.isFontStyleTag(tag)) {
      return "fontStyle";
    } else {
      throw new Error(`Unrecognized tag ${tag}!`);
    }
  }
};

export const structureNode = (node: Node): Pdf.HTMLNode[] => {
  const supported: Node[] = removeUnsupportedNodes(node);

  const structure = (n: Node): Pdf.HTMLNode | null => {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = n.nodeValue;
      if (!isNil(text)) {
        return {
          data: cleanText(text),
          type: "text",
          tag: null
        };
      }
      return null;
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      if (!isSupportedNode(n)) {
        console.warn(`Suspicious Behavior: Unsupported node ${n.nodeName} found!`);
        return null;
      } else {
        if (n.childNodes.length === 0) {
          console.warn(`Suspicious Behavior: Empty node ${n.nodeName} found!`);
          return null;
        }
        const tag = n.nodeName.toLocaleLowerCase() as Pdf.SupportedHTMLTag;
        if (n.childNodes.length === 1 && n.childNodes[0].nodeType === Node.TEXT_NODE) {
          const nodeValue = n.childNodes[0].nodeValue;
          if (isNil(nodeValue) || nodeValue === "") {
            console.warn(`Suspicious Behavior: Node ${n.childNodes[0].nodeName} has invalid value ${nodeValue}!`);
            return null;
          }
          return {
            tag,
            type: structuredNodeType(n),
            data: nodeValue
          } as Pdf.HTMLNode;
        }
        const children = filter(
          map(n.childNodes, (ni: Node) => structure(ni)),
          (ni: Pdf.HTMLNode | null) => !isNil(ni)
        ) as Pdf.HTMLNode[];
        if (children.length === 0) {
          console.warn(`Suspicious Behavior: Empty node ${n.nodeName} found!`);
          return null;
        }
        return { tag, type: structuredNodeType(n), data: children } as Pdf.HTMLNode;
      }
    } else {
      console.warn(`Suspicious Behavior: Unsupported node type ${n.nodeType} found!`);
      return null;
    }
  };
  return reduce(
    supported,
    (curr: Pdf.HTMLNode[], n: Node) => {
      const internal = structure(n);
      if (!isNil(internal)) {
        return [...curr, internal];
      }
      return [...curr];
    },
    []
  );
};

export const convertHtmlIntoDoc = (html: string): Node => {
  let doc = new DOMParser().parseFromString(html, "text/html");
  let element = doc.body;
  removeWhitespace(element);
  return element;
};

export const convertHtmlIntoNodes = (html: string): Pdf.HTMLNode[] | null => {
  return structureNode(convertHtmlIntoDoc(html));
};
