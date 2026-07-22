using Microsoft.AspNetCore.SignalR;

namespace Kanban.Api.Board;

public sealed class BoardHub(BoardStore store) : Hub
{
    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("BoardChanged", store.Get(), Context.ConnectionAborted);
        await base.OnConnectedAsync();
    }

    public Task AddColumn(AddColumnCommand command) =>
        ApplyAsync(() => store.AddColumnAsync(command, Context.ConnectionAborted));

    public Task AddTask(AddTaskCommand command) =>
        ApplyAsync(() => store.AddTaskAsync(command, Context.ConnectionAborted));

    public Task MoveTask(MoveTaskCommand command) =>
        ApplyAsync(() => store.MoveTaskAsync(command, Context.ConnectionAborted));

    public Task ToggleChecklist(ToggleChecklistCommand command) =>
        ApplyAsync(() => store.ToggleChecklistAsync(command, Context.ConnectionAborted));

    private async Task ApplyAsync(Func<Task<BoardState>> mutation)
    {
        var state = await mutation();
        await Clients.All.SendAsync("BoardChanged", state, Context.ConnectionAborted);
    }
}
