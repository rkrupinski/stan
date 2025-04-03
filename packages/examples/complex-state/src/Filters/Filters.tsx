import { useEffect, useState, type FC, type ChangeEvent, useRef } from "react";
import { useStan } from "@rkrupinski/stan/react";

import { orderAtom, titleAtom } from "./state";
import { order } from "../types";

import styles from "./Filters.module.scss";

const orderValues = [null, ...order] as const;

export const Filters: FC = () => {
  const [title, setTitle] = useStan(titleAtom);
  const [value, setValue] = useState(title);

  const orderRef = useRef(0);
  const [order, setOrder] = useStan(orderAtom);

  useEffect(() => {
    const v = value.trim().toLocaleLowerCase();

    if (v || title) setTitle(v);
  }, [value, setTitle]);

  return (
    <fieldset className={styles.container}>
      <label htmlFor="title">Search:</label>
      <input
        id="title"
        name="title"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
        }}
      />
      <label htmlFor="sort">Sort:</label>
      <button
        type="button"
        onClick={() => {
          setOrder(orderValues[++orderRef.current % orderValues.length]);
        }}
      >
        {!order && "-"}
        {order === "asc" && "▲"}
        {order === "desc" && "▼"}
      </button>
    </fieldset>
  );
};
