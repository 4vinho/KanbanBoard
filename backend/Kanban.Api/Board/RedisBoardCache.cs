using System.Text.Json;
using StackExchange.Redis;

namespace Kanban.Api.Board;

public sealed class RedisBoardCache(
    IConfiguration configuration,
    ILogger<RedisBoardCache> logger) : IAsyncDisposable
{
    private const string BoardKey = "kanban:board:v2";
    private readonly JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web);
    private ConnectionMultiplexer? connection;

    public async Task<BoardState?> ReadAsync()
    {
        try
        {
            var database = await GetDatabaseAsync();
            if (database is null) return null;

            var payload = await database.StringGetAsync(BoardKey);
            return payload.HasValue
                ? JsonSerializer.Deserialize<BoardState>(payload.ToString(), jsonOptions)
                : null;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Não foi possível ler o quadro do Redis");
            return null;
        }
    }

    public async Task WriteAsync(BoardState state)
    {
        try
        {
            var database = await GetDatabaseAsync();
            if (database is null) return;

            await database.StringSetAsync(BoardKey, JsonSerializer.Serialize(state, jsonOptions));
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Não foi possível atualizar o quadro no Redis");
        }
    }

    private async Task<IDatabase?> GetDatabaseAsync()
    {
        if (connection is { IsConnected: true }) return connection.GetDatabase();

        var connectionString = configuration.GetConnectionString("Redis");
        if (string.IsNullOrWhiteSpace(connectionString)) return null;

        connection = await ConnectionMultiplexer.ConnectAsync(connectionString);
        return connection.GetDatabase();
    }

    public async ValueTask DisposeAsync()
    {
        if (connection is not null) await connection.DisposeAsync();
    }
}
