declare module "css-tree" {
  export interface CssTreeList {
    forEach(callback: (node: CssTreeNode) => void): void;
  }

  export interface CssTreeNode {
    type: string;
    name?: string;
    property?: string;
    value?: string | CssTreeNode;
    important?: boolean;
    prelude?: CssTreeNode;
    block?: CssTreeNode;
    children?: CssTreeList;
  }

  export function parse(
    source: string,
    options?: {
      context?: string;
      positions?: boolean;
      onParseError?: (error: Error) => void;
    },
  ): CssTreeNode;
  export function generate(node: CssTreeNode): string;
}
