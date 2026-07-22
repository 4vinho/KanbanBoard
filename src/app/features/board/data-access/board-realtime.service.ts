import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { ReplaySubject } from 'rxjs';
import {
  BoardState,
  MoveBoardTask,
  NewBoardColumn,
  NewBoardTask,
  ToggleChecklistItem,
} from '../models/board-column.model';

@Injectable({ providedIn: 'root' })
export class BoardRealtimeService {
  private readonly stateSubject = new ReplaySubject<BoardState>(1);
  private readonly connection: HubConnection = new HubConnectionBuilder()
    .withUrl('/hubs/board')
    .withAutomaticReconnect()
    .build();

  readonly state$ = this.stateSubject.asObservable();

  constructor() {
    this.connection.on('BoardChanged', (state: BoardState) => this.stateSubject.next(state));
  }

  async connect(): Promise<void> {
    if (this.connection.state !== HubConnectionState.Disconnected) return;

    try {
      await this.connection.start();
    } catch {
      window.setTimeout(() => void this.connect(), 3000);
    }
  }

  addColumn(command: NewBoardColumn): Promise<void> {
    return this.invoke('AddColumn', command);
  }

  addTask(command: NewBoardTask): Promise<void> {
    return this.invoke('AddTask', command);
  }

  moveTask(command: MoveBoardTask): Promise<void> {
    return this.invoke('MoveTask', command);
  }

  toggleChecklist(command: ToggleChecklistItem): Promise<void> {
    return this.invoke('ToggleChecklist', command);
  }

  private async invoke(method: string, command: object): Promise<void> {
    if (this.connection.state === HubConnectionState.Disconnected) await this.connect();
    if (this.connection.state === HubConnectionState.Connected) await this.connection.invoke(method, command);
  }
}
