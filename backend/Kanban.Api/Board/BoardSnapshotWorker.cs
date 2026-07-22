namespace Kanban.Api.Board;

public sealed class BoardSnapshotWorker(
    BoardStore store,
    ILogger<BoardSnapshotWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await store.SaveSnapshotAsync(stoppingToken);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Falha ao salvar snapshot do quadro");
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        await store.SaveSnapshotAsync(cancellationToken);
        await base.StopAsync(cancellationToken);
    }
}
