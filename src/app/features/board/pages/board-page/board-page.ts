import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDialogService } from '@/shared/components/dialog';
import { MainContainer } from '../../../../core/components/main-container/main-container';
import { AddColumnDialog } from '../../components/add-column-dialog/add-column-dialog';
import { BoardGuide } from '../../components/board-guide/board-guide';
import { BoardStorageService } from '../../data-access/board-storage.service';
import { BoardColumn } from '../../models/board-column.model';

@Component({
  selector: 'app-board-page',
  imports: [BoardGuide, MainContainer, ZardButtonComponent],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPage {
  private readonly dialogService = inject(ZardDialogService);
  private readonly storageService = inject(BoardStorageService);

  protected readonly columns = signal<readonly BoardColumn[]>(this.storageService.loadColumns());

  constructor() {
    effect(() => this.storageService.saveColumns(this.columns()));
  }

  protected openAddColumnDialog(): void {
    this.dialogService.create<AddColumnDialog>({
      zTitle: 'Nova coluna',
      zDescription: 'Defina como o trabalho será acompanhado nesta coluna.',
      zContent: AddColumnDialog,
      zOkText: 'Adicionar coluna',
      zCancelText: 'Cancelar',
      zOnOk: (dialog) => this.addColumn(dialog),
      zWidth: '32rem',
    });
  }

  private addColumn(dialog: AddColumnDialog): false | void {
    const column = dialog.getColumn();

    if (!column) {
      return false;
    }

    this.columns.update((columns) => [
      ...columns,
      { ...column, id: crypto.randomUUID() },
    ]);
  }
}
