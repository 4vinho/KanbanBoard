import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, map, skip, Subject, withLatestFrom } from 'rxjs';
import { BoardStorageService } from '../data-access/board-storage.service';
import {
  BoardColumnViewModel,
  BoardState,
  BoardTask,
  MoveBoardTask,
  NewBoardColumn,
  NewBoardTask,
  ToggleChecklistItem,
} from '../models/board-column.model';

type BoardCommand =
  | { readonly type: 'add-column'; readonly payload: NewBoardColumn }
  | { readonly type: 'add-task'; readonly payload: NewBoardTask }
  | { readonly type: 'move-task'; readonly payload: MoveBoardTask }
  | { readonly type: 'toggle-checklist'; readonly payload: ToggleChecklistItem };

@Injectable({ providedIn: 'root' })
export class BoardFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly storageService = inject(BoardStorageService);
  private readonly stateSubject = new BehaviorSubject<BoardState>(this.storageService.loadBoard());
  private readonly commandsSubject = new Subject<BoardCommand>();

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
    this.commandsSubject
      .pipe(withLatestFrom(this.stateSubject), takeUntilDestroyed(this.destroyRef))
      .subscribe(([command, state]) => this.stateSubject.next(this.reduce(state, command)));

    this.stateSubject
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.storageService.saveBoard(state));
  }

  addColumn(column: NewBoardColumn): void {
    this.commandsSubject.next({ type: 'add-column', payload: column });
  }

  addTask(task: NewBoardTask): void {
    this.commandsSubject.next({ type: 'add-task', payload: task });
  }

  moveTask(move: MoveBoardTask): void {
    this.commandsSubject.next({ type: 'move-task', payload: move });
  }

  toggleChecklistItem(toggle: ToggleChecklistItem): void {
    this.commandsSubject.next({ type: 'toggle-checklist', payload: toggle });
  }

  private reduce(state: BoardState, command: BoardCommand): BoardState {
    switch (command.type) {
      case 'add-column':
        return {
          ...state,
          columns: [...state.columns, { ...command.payload, id: crypto.randomUUID() }],
        };
      case 'add-task':
        return this.addTaskToState(state, command.payload);
      case 'move-task':
        return this.moveTaskInState(state, command.payload);
      case 'toggle-checklist':
        return this.toggleChecklistInState(state, command.payload);
    }
  }

  private addTaskToState(state: BoardState, task: NewBoardTask): BoardState {
    const column = state.columns.find(({ id }) => id === task.columnId);
    if (!column || (column.type === 'done-only' && task.status === 'doing')) return state;

    const position = state.tasks.filter(
      (item) => item.columnId === task.columnId && item.status === task.status,
    ).length;
    const newTask: BoardTask = {
      id: crypto.randomUUID(),
      title: task.title.trim(),
      columnId: task.columnId,
      status: task.status,
      position,
      checklist: task.checklistDescriptions
        .map((description) => description.trim())
        .filter(Boolean)
        .map((description) => ({ id: crypto.randomUUID(), description, completed: false })),
    };

    return newTask.title ? { ...state, tasks: [...state.tasks, newTask] } : state;
  }

  private moveTaskInState(state: BoardState, move: MoveBoardTask): BoardState {
    const task = state.tasks.find(({ id }) => id === move.taskId);
    const targetColumn = state.columns.find(({ id }) => id === move.targetColumnId);
    if (!task || !targetColumn || (targetColumn.type === 'done-only' && move.targetStatus === 'doing')) return state;

    const remainingTasks = state.tasks.filter(({ id }) => id !== task.id);
    const destination = this.tasksForLane(remainingTasks, move.targetColumnId, move.targetStatus);
    destination.splice(Math.max(0, Math.min(move.targetIndex, destination.length)), 0, {
      ...task,
      columnId: move.targetColumnId,
      status: move.targetStatus,
    });

    const orderedDestination = destination.map((item, position) => ({ ...item, position }));
    const outsideDestination = remainingTasks.filter(
      (item) => item.columnId !== move.targetColumnId || item.status !== move.targetStatus,
    );
    return { ...state, tasks: this.normalizePositions([...outsideDestination, ...orderedDestination]) };
  }

  private toggleChecklistInState(state: BoardState, toggle: ToggleChecklistItem): BoardState {
    return {
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === toggle.taskId
          ? {
              ...task,
              checklist: task.checklist.map((item) =>
                item.id === toggle.itemId ? { ...item, completed: toggle.completed } : item,
              ),
            }
          : task,
      ),
    };
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

  private normalizePositions(tasks: readonly BoardTask[]): readonly BoardTask[] {
    const lanes = new Map<string, BoardTask[]>();
    for (const task of tasks) {
      const key = `${task.columnId}:${task.status}`;
      lanes.set(key, [...(lanes.get(key) ?? []), task]);
    }

    return [...lanes.values()].flatMap((lane) =>
      lane
        .sort((first, second) => first.position - second.position)
        .map((task, position) => ({ ...task, position })),
    );
  }
}
