import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, map } from 'rxjs';
import { BoardRealtimeService } from '../data-access/board-realtime.service';
import {
  BoardColumnViewModel,
  BoardState,
  BoardTask,
  EMPTY_BOARD_STATE,
  MoveBoardTask,
  NewBoardColumn,
  NewBoardTask,
  ToggleChecklistItem,
} from '../models/board-column.model';

@Injectable({ providedIn: 'root' })
export class BoardFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly realtime = inject(BoardRealtimeService);
  private readonly stateSubject = new BehaviorSubject<BoardState>(EMPTY_BOARD_STATE);

  readonly state$ = this.stateSubject.asObservable();
  readonly columns$ = this.state$.pipe(map((state) => state.columns));
  readonly tasks$ = this.state$.pipe(map((state) => state.tasks));
  readonly board$ = this.state$.pipe(
    map((state): readonly BoardColumnViewModel[] =>
      state.columns.map((column) => ({
        ...column,
        doingTasks: this.tasksForLane(state.tasks, column.id, 'doing'),
        doneTasks: this.tasksForLane(state.tasks, column.id, 'done'),
      })),
    ),
  );

  constructor() {
    this.realtime.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.stateSubject.next(state));
    void this.realtime.connect();
  }

  addColumn(column: NewBoardColumn): void {
    void this.realtime.addColumn(column);
  }

  addTask(task: NewBoardTask): void {
    void this.realtime.addTask(task);
  }

  moveTask(move: MoveBoardTask): void {
    void this.realtime.moveTask(move);
  }

  toggleChecklistItem(toggle: ToggleChecklistItem): void {
    void this.realtime.toggleChecklist(toggle);
  }

  private tasksForLane(
    tasks: readonly BoardTask[],
    columnId: string,
    status: BoardTask['status'],
  ): BoardTask[] {
    return tasks
      .filter((task) => task.columnId === columnId && task.status === status)
      .sort((first, second) => first.position - second.position);
  }
}
