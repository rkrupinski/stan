import { atom, selector, makeStore } from "../../../stan/src";

const store = makeStore();

const multiplier = atom(0);

const result = selector(({ get }) => 42 * get(multiplier));

print(result(store).get());

result(store).subscribe(print);

document.querySelector("#button")!.addEventListener("click", () => {
  multiplier(store).set((prev) => prev + 1);
});

function print(value: number) {
  document.querySelector("#output")!.textContent += `\n${value}`;
}
