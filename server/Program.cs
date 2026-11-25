using Microsoft.EntityFrameworkCore;
using TodoApi;
using TodoApi.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.OpenApi;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<ToDoDbContext>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),

            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header"
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI();

app.MapPost("/register", (
    AuthDto dto,
    ToDoDbContext context,
    IPasswordHasher<User> hasher) =>
   {
      if (context.Users.Any(u => u.Username == dto.Username))
        return Results.Conflict("Username already exists"); 
    var user = new User
    {
        Username = dto.Username
    };
   user.PasswordHash = hasher.HashPassword(user, dto.Password);
    context.Users.Add(user);
    context.SaveChanges();

    return Results.Ok("User registered successfully");
});

app.MapPost("/login", (
    AuthDto dto,
    ToDoDbContext context,
    IPasswordHasher<User> hasher) =>
{
    var user = context.Users.FirstOrDefault(u => u.Username == dto.Username);

    if (user == null)
        return Results.Unauthorized();

    var result = hasher.VerifyHashedPassword(
        user,
        user.PasswordHash,
        dto.Password);

    if (result == PasswordVerificationResult.Failed)
        return Results.Unauthorized();

    var claims = new[]
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Name, user.Username)
};

var key = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!));

var credentials = new SigningCredentials(
    key,
    SecurityAlgorithms.HmacSha256);

var token = new JwtSecurityToken(
    claims: claims,
    expires: DateTime.UtcNow.AddHours(1),
    signingCredentials: credentials);

var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

return Results.Ok(new
{
    token = tokenString,
    username = user.Username
});
});

app.MapGet("/items",(ToDoDbContext context)=>{
    return context.Items.ToList();
}).RequireAuthorization();

app.MapPost("/items",(Item item, ToDoDbContext context)=>{
    context.Items.Add(item);
    context.SaveChanges();

    return Results.Created($"/items/{item.Id}",item);
}).RequireAuthorization();

app.MapPut("/items/{id}", (int id, Item updatedItem, ToDoDbContext context) =>
{
    var item = context.Items.Find(id);

    if (item == null)
        return Results.NotFound();

    item.Name = updatedItem.Name;
    item.IsComplete = updatedItem.IsComplete;

    context.SaveChanges();

    return Results.Ok(item);
}).RequireAuthorization();

app.MapDelete("/items/{id}", (int id, ToDoDbContext context) =>
{
    var item = context.Items.Find(id);

    if (item == null)
        return Results.NotFound();

    context.Items.Remove(item);
    context.SaveChanges();

    return Results.NoContent();
}).RequireAuthorization();

app.MapGet("/", () => "Hello World!");

app.Run();
