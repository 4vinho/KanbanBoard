import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';
import { BoardTask } from '../../models/board-column.model';

@Component({
  selector: 'app-task-card',
  imports: [FormsModule, ZardCheckboxComponent],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  readonly task = input.required<BoardTask>();
  readonly checklistToggle = output<{ readonly itemId: string; readonly completed: boolean }>();

  protected readonly completedItems = computed(
    () => this.task().checklist.filter(({ completed }) => completed).length,
  );

  protected toggleChecklist(itemId: string, completed: boolean): void {
    this.checklistToggle.emit({ itemId, completed });
  }
}
