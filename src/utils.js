export function normalizeTocOption(toc) {
  return toc === true ? true : toc === false ? false : undefined;
}

export function printOutputMsg(outputPath) {
  console.log(`Written: ${outputPath}`);
}

export function handleCliError(err) {
  console.error(err.message);
  process.exit(1);
}
