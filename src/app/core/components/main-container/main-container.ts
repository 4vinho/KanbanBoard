import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-main-container',
  templateUrl: './main-container.html',
  styleUrl: './main-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainContainer {
  readonly boardTitle = input.required<string>();
}
