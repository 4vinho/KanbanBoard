namespace Kanban.Api.Board;

public sealed record BoardState(int Version, IReadOnlyList<BoardColumn> Columns, IReadOnlyList<BoardTask> Tasks)
{
    public static BoardState Empty { get; } = new(2, [], []);
}

public sealed record BoardColumn(Guid Id, string Title, string Type);

public sealed record BoardTask(
    Guid Id,
    string Title,
    Guid ColumnId,
    string Status,
    int Position,
    IReadOnlyList<ChecklistItem> Checklist);

public sealed record ChecklistItem(Guid Id, string Description, bool Completed);

public sealed record AddColumnCommand(string Title, string Type);

public sealed record AddTaskCommand(
    string Title,
    Guid ColumnId,
    string Status,
    IReadOnlyList<string> ChecklistDescriptions);

public sealed record MoveTaskCommand(Guid TaskId, Guid TargetColumnId, string TargetStatus, int TargetIndex);

public sealed record ToggleChecklistCommand(Guid TaskId, Guid ItemId, bool Completed);
