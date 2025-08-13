export const Tabs = {
  ALL: "all",
  CREATE: "create",
  EDIT: "edit",
} as const;

export type TabType = (typeof Tabs)[keyof typeof Tabs];
