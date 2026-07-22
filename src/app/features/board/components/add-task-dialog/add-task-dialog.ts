import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';

export interface NewTaskContent {
  readonly title: string;
  readonly checklistDescriptions: readonly string[];
}

@Component({
  selector: 'app-add-task-dialog',
  imports: [ZardButtonComponent, ZardInputComponent],
  templateUrl: './add-task-dialog.html',
  styleUrl: './add-task-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTaskDialog {
  protected readonly title = signal('');
  protected readonly checklist = signal<readonly string[]>(['']);

  protected setTitle(value: string | number | null | undefined): void {
    this.title.set(String(value ?? ''));
  }

  protected setChecklistItem(index: number, value: string | number | null | undefined): void {
    this.checklist.update((items) =>
      items.map((item, itemIndex) => itemIndex === index ? String(value ?? '') : item),
    );
  }

  protected addChecklistItem(): void {
    this.checklist.update((items) => [...items, '']);
  }

  protected removeChecklistItem(index: number): void {
    this.checklist.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  getTask(): NewTaskContent | null {
    const title = this.title().trim();
    if (!title) return null;

    return {
      title,
      checklistDescriptions: this.checklist().map((item) => item.trim()).filter(Boolean),
    };
  }
}
