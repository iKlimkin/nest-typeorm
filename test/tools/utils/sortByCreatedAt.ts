export const sortByCreatedAt = (a, b) => {
  const dateA = new Date(a);
  const dateB = new Date(b);

  if (dateA < dateB) {
    return -1;
  }
  if (dateA > dateB) {
    return 1;
  }

  return 0;
};
