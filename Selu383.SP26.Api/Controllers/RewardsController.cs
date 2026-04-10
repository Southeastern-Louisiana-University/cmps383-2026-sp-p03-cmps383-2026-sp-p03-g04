using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Rewards;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/rewards")]
public class RewardsController(DataContext dataContext) : ControllerBase
{
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<RewardsSummaryDto>> Me()
    {
        var userId = User.GetCurrentUserId();

        var user = await dataContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == userId);

        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(new RewardsSummaryDto
        {
            ByteBalance = user.ByteBalance,
            ByteDollarValue = user.ByteBalance / 100m
        });
    }
}