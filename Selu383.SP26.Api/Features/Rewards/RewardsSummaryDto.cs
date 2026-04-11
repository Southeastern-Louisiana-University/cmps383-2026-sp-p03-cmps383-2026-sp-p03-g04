namespace Selu383.SP26.Api.Features.Rewards;

public class RewardsSummaryDto
{
    public int ByteBalance { get; set; }

    public decimal ByteDollarValue { get; set; }

    public int BytesPerDollarSpent { get; set; } = RewardsConstants.BytesPerDollarSpent;

    public decimal MaxDiscountPercentage { get; set; } = RewardsConstants.MaxDiscountPercentage;
}