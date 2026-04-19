import { atom, selector, DEFAULT_STORE } from "@rkrupinski/stan";

const multiplier = atom(0);

const result = selector(({ get }) => 42 * get(multiplier));

print(result(DEFAULT_STORE).get());

result(DEFAULT_STORE).subscribe(print);

document.querySelector("#button")!.addEventListener("click", () => {
  multiplier(DEFAULT_STORE).set((prev) => prev + 1);
});

function print(value: number) {
  document.querySelector("#output")!.textContent += `\n${value}`;
}
