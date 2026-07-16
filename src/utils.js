export function normalizeTocOption(toc) {
  return toc === true ? true : toc === false ? false : undefined;
}
