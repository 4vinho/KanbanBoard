using Kanban.Api.Board;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(builder.Configuration["FrontendUrl"] ?? "http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});
builder.Services.AddSingleton<BoardStore>();
builder.Services.AddSingleton<RedisBoardCache>();
builder.Services.AddHostedService<BoardSnapshotWorker>();

var app = builder.Build();

app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/board", (BoardStore store) => Results.Ok(store.Get()));

await app.Services.GetRequiredService<BoardStore>().InitializeAsync();
app.Run();
