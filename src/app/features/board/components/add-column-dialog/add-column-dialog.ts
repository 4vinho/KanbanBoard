import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { BoardGuideType } from '../board-guide/board-guide';

export interface NewBoardColumn {
  readonly title: string;
  readonly type: BoardGuideType;
}

@Component({
  selector: 'app-add-column-dialog',
  imports: [ZardInputComponent, ZardSelectComponent, ZardSelectItemComponent],
  templateUrl: './add-column-dialog.html',
  styleUrl: './add-column-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddColumnDialog {
  protected readonly title = signal('');
  protected readonly type = signal<BoardGuideType>('doing-and-done');

  setTitle(value: string | number | null | undefined): void {
    this.title.set(String(value ?? ''));
  }

  setType(value: string | string[]): void {
    if (value === 'doing-and-done' || value === 'done-only') {
      this.type.set(value);
    }
  }

  getColumn(): NewBoardColumn | null {
    const title = this.title().trim();
    return title ? { title, type: this.type() } : null;
  }
}
