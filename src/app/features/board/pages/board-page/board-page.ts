import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDialogService } from '@/shared/components/dialog';
import { MainContainer } from '../../../../core/components/main-container/main-container';
import { AddColumnDialog, NewBoardColumn } from '../../components/add-column-dialog/add-column-dialog';
import { BoardGuide } from '../../components/board-guide/board-guide';

@Component({
  selector: 'app-board-page',
  imports: [BoardGuide, MainContainer, ZardButtonComponent],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPage {
  private readonly dialogService = inject(ZardDialogService);

  protected readonly columns = signal<readonly (NewBoardColumn & { readonly id: string })[]>([]);

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
