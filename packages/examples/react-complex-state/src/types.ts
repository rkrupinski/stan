export type Todo = {
  id: string;
  title: string;
};

export const order = ["asc", "desc"] as const;

export type Order = (typeof order)[number];
