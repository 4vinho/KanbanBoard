import { CdkDragDrop, CdkDrag, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import {
  BoardGuideType,
  BoardTask,
  MoveBoardTask,
  TaskStatus,
  ToggleChecklistItem,
} from '../../models/board-column.model';
import { TaskCard } from '../task-card/task-card';

@Component({
  selector: 'app-board-guide',
  imports: [CdkDrag, CdkDragHandle, CdkDropList, TaskCard, ZardButtonComponent],
  templateUrl: './board-guide.html',
  styleUrl: './board-guide.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardGuide {
  readonly columnId = input.required<string>();
  readonly title = input.required<string>();
  readonly type = input.required<BoardGuideType>();
  readonly doingTasks = input<readonly BoardTask[]>([]);
  readonly doneTasks = input<readonly BoardTask[]>([]);

  readonly addTask = output<{ readonly columnId: string; readonly status: TaskStatus }>();
  readonly taskDrop = output<MoveBoardTask>();
  readonly checklistToggle = output<ToggleChecklistItem>();

  protected requestTask(status: TaskStatus): void {
    this.addTask.emit({ columnId: this.columnId(), status });
  }

  protected dropTask(event: CdkDragDrop<readonly BoardTask[]>, status: TaskStatus): void {
    const task = event.item.data as BoardTask;
    this.taskDrop.emit({
      taskId: task.id,
      targetColumnId: this.columnId(),
      targetStatus: status,
      targetIndex: event.currentIndex,
    });
  }

  protected toggleChecklist(taskId: string, itemId: string, completed: boolean): void {
    this.checklistToggle.emit({ taskId, itemId, completed });
  }

  protected laneId(status: TaskStatus): string {
    return `${this.columnId()}-${status}`;
  }
}
