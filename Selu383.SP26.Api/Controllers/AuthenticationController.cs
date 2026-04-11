using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using System.Security.Claims;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/authentication")]
public class AuthenticationController : ControllerBase
{
    private readonly SignInManager<User> signInManager;
    private readonly UserManager<User> userManager;

    public AuthenticationController(
        SignInManager<User> signInManager,
        UserManager<User> userManager)
    {
        this.signInManager = signInManager;
        this.userManager = userManager;
    }

    [HttpGet("external/{provider}")]
    public IActionResult ExternalLogin([FromRoute] string provider, [FromQuery] string? returnUrl = null)
    {
        if (!IsSupportedProvider(provider))
        {
            return BadRequest($"Unsupported provider '{provider}'.");
        }

        var callbackUrl = Url.ActionLink(
            action: nameof(ExternalLoginCallback),
            controller: "Authentication",
            values: new { returnUrl });

        if (callbackUrl == null)
        {
            return StatusCode(500, "Could not generate callback URL.");
        }

        var properties = signInManager.ConfigureExternalAuthenticationProperties(provider, callbackUrl);
        return Challenge(properties, provider);
    }

    [HttpGet("external-callback")]
    public async Task<IActionResult> ExternalLoginCallback([FromQuery] string? returnUrl = null, [FromQuery] string? remoteError = null)
    {
        var safeReturnUrl = IsSafeLocalReturnUrl(returnUrl) ? returnUrl! : "/";

        if (!string.IsNullOrWhiteSpace(remoteError))
        {
            return Redirect($"{safeReturnUrl}?auth=error");
        }

        var info = await signInManager.GetExternalLoginInfoAsync();
        if (info == null)
        {
            return Redirect($"{safeReturnUrl}?auth=error");
        }

        // If the user already has a linked external login, sign them in.
        var signInResult = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            isPersistent: false,
            bypassTwoFactor: true);

        if (signInResult.Succeeded)
        {
            return Redirect($"{safeReturnUrl}?auth=success");
        }

        // Try to match by email (common for first-time external sign-in).
        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        User? user = null;

        if (!string.IsNullOrWhiteSpace(email))
        {
            user = await userManager.FindByEmailAsync(email);
        }

        if (user == null)
        {
            var username = !string.IsNullOrWhiteSpace(email)
                ? email
                : $"{info.LoginProvider}-{info.ProviderKey}";

            user = new User
            {
                UserName = username,
                Email = email
            };

            var createResult = await userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                return Redirect($"{safeReturnUrl}?auth=error");
            }
        }

        var addLoginResult = await userManager.AddLoginAsync(user, info);
        if (!addLoginResult.Succeeded)
        {
            // If login already exists (race), fall back to normal sign-in.
            // Otherwise treat as error.
            var existing = await userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
            if (existing == null)
            {
                return Redirect($"{safeReturnUrl}?auth=error");
            }
            user = existing;
        }

        await signInManager.SignInAsync(user, isPersistent: false);
        return Redirect($"{safeReturnUrl}?auth=success");
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var username = User.GetCurrentUserName();
        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.UserName == username);
        return Ok(resultDto);
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto dto)
    {
        var user = await userManager.FindByNameAsync(dto.UserName);
        if (user == null)
        {
            return BadRequest();
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, dto.Password, true);
        if (!result.Succeeded)
        {
            return BadRequest();
        }

        await signInManager.SignInAsync(user, false);

        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.UserName == user.UserName);
        return Ok(resultDto);
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto dto)
    {
        var existingUser = await userManager.FindByNameAsync(dto.UserName);
        if (existingUser != null)
        {
            return BadRequest("That username is already taken.");
        }

        var newUser = new User
        {
            UserName = dto.UserName,
        };

        var createResult = await userManager.CreateAsync(newUser, dto.Password);
        if (!createResult.Succeeded)
        {
            var errors = createResult.Errors.Select(x => x.Description).ToArray();
            return BadRequest(errors);
        }

        var roleResult = await userManager.AddToRoleAsync(newUser, RoleNames.User);
        if (!roleResult.Succeeded)
        {
            var errors = roleResult.Errors.Select(x => x.Description).ToArray();
            return BadRequest(errors);
        }

        await signInManager.SignInAsync(newUser, false);

        var resultDto = await GetUserDto(userManager.Users).SingleAsync(x => x.UserName == newUser.UserName);
        return Ok(resultDto);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok();
    }

    private static IQueryable<UserDto> GetUserDto(IQueryable<User> users)
    {
        return users.Select(x => new UserDto
        {
            Id = x.Id,
            UserName = x.UserName!,
            Roles = x.UserRoles.Select(y => y.Role!.Name).ToArray()!,
            ByteBalance = x.ByteBalance
        });
    }

    private static bool IsSupportedProvider(string provider)
    {
        return provider.Equals("Google", StringComparison.OrdinalIgnoreCase)
            || provider.Equals("Facebook", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSafeLocalReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            return false;
        }

        // Allow only local relative paths to avoid open redirects.
        return returnUrl.StartsWith("/", StringComparison.Ordinal)
               && !returnUrl.StartsWith("//", StringComparison.Ordinal)
               && !returnUrl.StartsWith("/\\", StringComparison.Ordinal);
    }
}
//hhhhhhh