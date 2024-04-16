export const convertPublishedStatus = {
  published: true,
  unpublished: false,
  all: 'all',
};

export enum publishedStatuses {
  all = 'all',
  published = 'published',
  unpublished = 'unpublished',
}

export enum GameStatus {
  PendingSecondPlayer = 'PendingSecondPlayer',
  Active = 'Active',
  Finished = 'Finished',
}

export enum AnswerStatus {
  Correct = 'Correct',
  Incorrect = 'Incorrect',
}
