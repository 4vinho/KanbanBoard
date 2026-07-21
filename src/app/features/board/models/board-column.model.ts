export type BoardGuideType = 'doing-and-done' | 'done-only';

export interface BoardColumn {
  readonly id: string;
  readonly title: string;
  readonly type: BoardGuideType;
}

export type NewBoardColumn = Omit<BoardColumn, 'id'>;
