import { effect, inject, Injectable, signal } from '@angular/core';
import { BoardStorageService } from '../data-access/board-storage.service';
import { BoardColumn, NewBoardColumn } from '../models/board-column.model';

@Injectable({ providedIn: 'root' })
export class BoardFacade {
  private readonly storageService = inject(BoardStorageService);
  private readonly columnsState = signal<readonly BoardColumn[]>(this.storageService.loadColumns());

  readonly columns = this.columnsState.asReadonly();

  constructor() {
    effect(() => this.storageService.saveColumns(this.columnsState()));
  }

  addColumn(column: NewBoardColumn): void {
    this.columnsState.update((columns) => [
      ...columns,
      { ...column, id: crypto.randomUUID() },
    ]);
  }
}
