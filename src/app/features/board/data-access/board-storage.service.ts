import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BoardColumn, BoardGuideType } from '../models/board-column.model';

const STORAGE_KEY = 'kanban-board:columns:v1';

interface StoredBoard {
  readonly version: 1;
  readonly columns: readonly BoardColumn[];
}

@Injectable({ providedIn: 'root' })
export class BoardStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  loadColumns(): readonly BoardColumn[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }

    try {
      const serializedBoard = localStorage.getItem(STORAGE_KEY);
      if (!serializedBoard) {
        return [];
      }

      const storedBoard: unknown = JSON.parse(serializedBoard);
      return this.isStoredBoard(storedBoard) ? storedBoard.columns : [];
    } catch {
      return [];
    }
  }

  saveColumns(columns: readonly BoardColumn[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storedBoard: StoredBoard = { version: 1, columns };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedBoard));
    } catch {
      // A aplicação continua utilizável quando o armazenamento está indisponível ou cheio.
    }
  }

  private isStoredBoard(value: unknown): value is StoredBoard {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<StoredBoard>;
    return candidate.version === 1 && Array.isArray(candidate.columns) && candidate.columns.every(
      (column) => this.isBoardColumn(column),
    );
  }

  private isBoardColumn(value: unknown): value is BoardColumn {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<BoardColumn>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.title === 'string' &&
      this.isBoardGuideType(candidate.type)
    );
  }

  private isBoardGuideType(value: unknown): value is BoardGuideType {
    return value === 'doing-and-done' || value === 'done-only';
  }
}
