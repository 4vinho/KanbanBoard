using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace Kanban.Api.Board;

public sealed class BoardStore(IConfiguration configuration)
{
    private readonly SemaphoreSlim gate = new(1, 1);
    private readonly JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string databasePath = Path.GetFullPath(configuration["SqlitePath"] ?? "data/kanban.db");
    private BoardState state = BoardState.Empty;
    private int dirty;

    public BoardState Get() => state;

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(databasePath)!);
        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var create = connection.CreateCommand();
        create.CommandText = """
            CREATE TABLE IF NOT EXISTS snapshots (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """;
        await create.ExecuteNonQueryAsync(cancellationToken);

        var read = connection.CreateCommand();
        read.CommandText = "SELECT payload FROM snapshots WHERE id = 1";
        var payload = await read.ExecuteScalarAsync(cancellationToken) as string;
        if (payload is not null)
        {
            state = JsonSerializer.Deserialize<BoardState>(payload, jsonOptions) ?? BoardState.Empty;
        }
    }

    public Task<BoardState> AddColumnAsync(AddColumnCommand command, CancellationToken cancellationToken) =>
        MutateAsync(current => BoardReducer.AddColumn(current, command), cancellationToken);

    public Task<BoardState> AddTaskAsync(AddTaskCommand command, CancellationToken cancellationToken) =>
        MutateAsync(current => BoardReducer.AddTask(current, command), cancellationToken);

    public Task<BoardState> MoveTaskAsync(MoveTaskCommand command, CancellationToken cancellationToken) =>
        MutateAsync(current => BoardReducer.MoveTask(current, command), cancellationToken);

    public Task<BoardState> ToggleChecklistAsync(ToggleChecklistCommand command, CancellationToken cancellationToken) =>
        MutateAsync(current => BoardReducer.ToggleChecklist(current, command), cancellationToken);

    public async Task SaveSnapshotAsync(CancellationToken cancellationToken = default)
    {
        if (Interlocked.Exchange(ref dirty, 0) == 0) return;

        try
        {
            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken);
            var command = connection.CreateCommand();
            command.CommandText = """
                INSERT INTO snapshots(id, payload, updated_at)
                VALUES(1, $payload, $updatedAt)
                ON CONFLICT(id) DO UPDATE SET
                    payload = excluded.payload,
                    updated_at = excluded.updated_at
                """;
            command.Parameters.AddWithValue("$payload", JsonSerializer.Serialize(state, jsonOptions));
            command.Parameters.AddWithValue("$updatedAt", DateTimeOffset.UtcNow.ToString("O"));
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch
        {
            Interlocked.Exchange(ref dirty, 1);
            throw;
        }
    }

    private async Task<BoardState> MutateAsync(
        Func<BoardState, BoardState> mutation,
        CancellationToken cancellationToken)
    {
        await gate.WaitAsync(cancellationToken);
        try
        {
            state = mutation(state);
            Interlocked.Exchange(ref dirty, 1);
            return state;
        }
        finally
        {
            gate.Release();
        }
    }

    private SqliteConnection CreateConnection() => new($"Data Source={databasePath}");
}
