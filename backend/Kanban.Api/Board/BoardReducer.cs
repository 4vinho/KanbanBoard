namespace Kanban.Api.Board;

public static class BoardReducer
{
    public static BoardState AddColumn(BoardState state, AddColumnCommand command)
    {
        var title = command.Title.Trim();
        if (title.Length == 0 || command.Type is not ("doing-and-done" or "done-only")) return state;

        return state with
        {
            Columns = [.. state.Columns, new BoardColumn(Guid.NewGuid(), title, command.Type)]
        };
    }

    public static BoardState AddTask(BoardState state, AddTaskCommand command)
    {
        var column = state.Columns.FirstOrDefault(item => item.Id == command.ColumnId);
        var title = command.Title.Trim();
        if (column is null || title.Length == 0 || !IsValidStatus(command.Status)) return state;
        if (column.Type == "done-only" && command.Status == "doing") return state;

        var position = state.Tasks.Count(item => item.ColumnId == command.ColumnId && item.Status == command.Status);
        var checklist = command.ChecklistDescriptions
            .Select(description => description.Trim())
            .Where(description => description.Length > 0)
            .Select(description => new ChecklistItem(Guid.NewGuid(), description, false))
            .ToArray();
        var task = new BoardTask(Guid.NewGuid(), title, command.ColumnId, command.Status, position, checklist);

        return state with { Tasks = [.. state.Tasks, task] };
    }

    public static BoardState MoveTask(BoardState state, MoveTaskCommand command)
    {
        var task = state.Tasks.FirstOrDefault(item => item.Id == command.TaskId);
        var column = state.Columns.FirstOrDefault(item => item.Id == command.TargetColumnId);
        if (task is null || column is null || !IsValidStatus(command.TargetStatus)) return state;
        if (column.Type == "done-only" && command.TargetStatus == "doing") return state;

        var remaining = state.Tasks.Where(item => item.Id != task.Id).ToList();
        var destination = remaining
            .Where(item => item.ColumnId == command.TargetColumnId && item.Status == command.TargetStatus)
            .OrderBy(item => item.Position)
            .ToList();

        destination.Insert(Math.Clamp(command.TargetIndex, 0, destination.Count), task with
        {
            ColumnId = command.TargetColumnId,
            Status = command.TargetStatus
        });

        remaining.RemoveAll(item => item.ColumnId == command.TargetColumnId && item.Status == command.TargetStatus);
        remaining.AddRange(destination.Select((item, position) => item with { Position = position }));

        var normalized = remaining
            .GroupBy(item => (item.ColumnId, item.Status))
            .SelectMany(group => group
                .OrderBy(item => item.Position)
                .Select((item, position) => item with { Position = position }))
            .ToArray();

        return state with { Tasks = normalized };
    }

    public static BoardState ToggleChecklist(BoardState state, ToggleChecklistCommand command)
    {
        return state with
        {
            Tasks = state.Tasks.Select(task => task.Id != command.TaskId ? task : task with
            {
                Checklist = task.Checklist
                    .Select(item => item.Id == command.ItemId ? item with { Completed = command.Completed } : item)
                    .ToArray()
            }).ToArray()
        };
    }

    private static bool IsValidStatus(string status) => status is "doing" or "done";
}
