export const contentLength = { min: 3, max: 1000 };
export const descriptionLength = { min: 3, max: 500 };
export const questionLength = { min: 10, max: 500 };
export const urlLength = { min: 3, max: 100 };
export const frequentLength = { min: 3, max: 100 };
export const titleLength = { min: 3, max: 30 };
export const nameLength = { min: 3, max: 15 };
export const contentPostLength = { min: 20, max: 300 };
export const blogIdLength = { min: 20, max: 40 };
export const passwordLength = { min: 6, max: 20 };
export const loginLength = { min: 3, max: 10 };
export const answerLength = { min: 1, max: 100 };
export const loginMatch = /^[a-zA-Z0-9_-]*$/;
export const emailMatches = /^\s*[\w-\.]+@([\w-]+\.)+[\w-]{2,4}\s*$/;
export const urlMatching =
  /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/;
