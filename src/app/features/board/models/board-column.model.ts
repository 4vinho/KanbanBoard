export type BoardGuideType = 'doing-and-done' | 'done-only';
export type TaskStatus = 'doing' | 'done';

export interface BoardColumn {
  readonly id: string;
  readonly title: string;
  readonly type: BoardGuideType;
}

export type NewBoardColumn = Omit<BoardColumn, 'id'>;

export interface ChecklistItem {
  readonly id: string;
  readonly description: string;
  readonly completed: boolean;
}

export interface BoardTask {
  readonly id: string;
  readonly title: string;
  readonly columnId: string;
  readonly status: TaskStatus;
  readonly position: number;
  readonly checklist: readonly ChecklistItem[];
}

export interface BoardState {
  readonly version: 2;
  readonly columns: readonly BoardColumn[];
  readonly tasks: readonly BoardTask[];
}

export interface BoardColumnViewModel extends BoardColumn {
  readonly doingTasks: readonly BoardTask[];
  readonly doneTasks: readonly BoardTask[];
}

export interface NewBoardTask {
  readonly title: string;
  readonly columnId: string;
  readonly status: TaskStatus;
  readonly checklistDescriptions: readonly string[];
}

export interface MoveBoardTask {
  readonly taskId: string;
  readonly targetColumnId: string;
  readonly targetStatus: TaskStatus;
  readonly targetIndex: number;
}

export interface ToggleChecklistItem {
  readonly taskId: string;
  readonly itemId: string;
  readonly completed: boolean;
}

export const EMPTY_BOARD_STATE: BoardState = {
  version: 2,
  columns: [],
  tasks: [],
};
