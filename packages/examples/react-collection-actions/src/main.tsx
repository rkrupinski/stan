import { createRoot } from "react-dom/client";

import { Example } from "./Example";
import { StanProvider } from "@rkrupinski/stan/react";
import { makeStore } from "@rkrupinski/stan";

const s = makeStore();

createRoot(document.getElementById("root")!).render(
  <StanProvider store={s}>
    <Example />
  </StanProvider>
);
