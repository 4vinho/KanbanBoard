import { TestBed } from '@angular/core/testing';
import { BoardStorageService } from '../data-access/board-storage.service';
import { BoardColumnViewModel, BoardState } from '../models/board-column.model';
import { BoardFacade } from './board.facade';

describe('BoardFacade', () => {
  const initialState: BoardState = {
    version: 2,
    columns: [
      { id: 'column-1', title: 'Desenvolvimento', type: 'doing-and-done' },
      { id: 'column-2', title: 'Produção', type: 'done-only' },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Primeira',
        columnId: 'column-1',
        status: 'doing',
        position: 0,
        checklist: [{ id: 'item-1', description: 'Implementar', completed: false }],
      },
      {
        id: 'task-2',
        title: 'Segunda',
        columnId: 'column-1',
        status: 'doing',
        position: 1,
        checklist: [],
      },
    ],
  };

  let facade: BoardFacade;
  let state: BoardState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BoardStorageService,
          useValue: {
            loadBoard: () => structuredClone(initialState),
            saveBoard: vi.fn(),
          },
        },
      ],
    });

    facade = TestBed.inject(BoardFacade);
    state = initialState;
    facade.state$.subscribe((value) => state = value);
  });

  it('should expose the board grouped by lanes', () => {
    let board: readonly BoardColumnViewModel[] = [];
    facade.board$.subscribe((value) => board = value);

    expect(board[0]?.doingTasks.map(({ id }) => id)).toEqual(['task-1', 'task-2']);
    expect(board[1]?.doingTasks).toEqual([]);
  });

  it('should add a task with checklist items', () => {
    facade.addTask({
      title: 'Nova tarefa',
      columnId: 'column-1',
      status: 'done',
      checklistDescriptions: ['Item válido', '  '],
    });

    expect(state.tasks).toContainEqual(
      expect.objectContaining({
        title: 'Nova tarefa',
        columnId: 'column-1',
        status: 'done',
        checklist: [expect.objectContaining({ description: 'Item válido', completed: false })],
      }),
    );
  });

  it('should reorder tasks in the same lane', () => {
    facade.moveTask({ taskId: 'task-1', targetColumnId: 'column-1', targetStatus: 'doing', targetIndex: 1 });

    const lane = state.tasks
      .filter(({ columnId, status }) => columnId === 'column-1' && status === 'doing')
      .sort((first, second) => first.position - second.position);
    expect(lane.map(({ id }) => id)).toEqual(['task-2', 'task-1']);
  });

  it('should move a task to another column and lane', () => {
    facade.moveTask({ taskId: 'task-1', targetColumnId: 'column-2', targetStatus: 'done', targetIndex: 0 });

    expect(state.tasks.find(({ id }) => id === 'task-1')).toEqual(
      expect.objectContaining({ columnId: 'column-2', status: 'done', position: 0 }),
    );
    expect(state.tasks.find(({ id }) => id === 'task-2')?.position).toBe(0);
  });

  it('should toggle a checklist item without moving the task', () => {
    facade.toggleChecklistItem({ taskId: 'task-1', itemId: 'item-1', completed: true });

    const task = state.tasks.find(({ id }) => id === 'task-1');
    expect(task?.checklist[0]?.completed).toBe(true);
    expect(task).toEqual(expect.objectContaining({ columnId: 'column-1', status: 'doing' }));
  });
});
