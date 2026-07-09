function calculateCommissions(client, lead) {
  const commissions = [];
  const { dealType, monthlyAmount, lifetimeAmount, enterpriseAmount } = client;

  // ─── MONTHLY SUBSCRIPTION ───
  if (['monthly_subscription', 'weekly', 'monthly'].includes(dealType)) {
    const amount = monthlyAmount;

    // Lead Researcher: 5% of Month 1 only
    if (lead.submittedBy) {
      commissions.push({
        earnedBy: lead.submittedBy,
        commissionRole: 'lead_researcher',
        commissionRate: 0.05,
        commissionAmount: amount * 0.05,
        isRecurring: false,
        dealAmount: amount
      });
    }

    // Sales Closer: 15% recurring for months 1-6, then 5% forever
    if (client.closedBy) {
      for (let month = 1; month <= 6; month++) {
        commissions.push({
          earnedBy: client.closedBy,
          commissionRole: 'sales_closer_recurring',
          commissionRate: 0.15,
          commissionAmount: amount * 0.15,
          isRecurring: true,
          recurringMonth: month,
          recurringEndMonth: 6,
          dealAmount: amount
        });
      }
      commissions.push({
        earnedBy: client.closedBy,
        commissionRole: 'sales_closer_recurring',
        commissionRate: 0.05,
        commissionAmount: amount * 0.05,
        isRecurring: true,
        recurringMonth: 7,
        recurringEndMonth: 9999,
        dealAmount: amount
      });
    }

    // CA Partner: 10% recurring forever
    if (client.caPartner) {
      commissions.push({
        earnedBy: client.caPartner,
        commissionRole: 'ca_partner',
        commissionRate: 0.10,
        commissionAmount: amount * 0.10,
        isRecurring: true,
        recurringMonth: 1,
        recurringEndMonth: 9999,
        dealAmount: amount
      });
    }

    // Growth Hacker: 3% of Month 1 only
    if (client.growthHacker) {
      commissions.push({
        earnedBy: client.growthHacker,
        commissionRole: 'growth_hacker',
        commissionRate: 0.03,
        commissionAmount: amount * 0.03,
        isRecurring: false,
        dealAmount: amount
      });
    }
  }

  // ─── LIFETIME DEAL / ONE TIME ───
  if (['lifetime_deal', 'one_time'].includes(dealType)) {
    const amount = lifetimeAmount;

    if (lead.submittedBy) {
      commissions.push({
        earnedBy: lead.submittedBy,
        commissionRole: 'lead_researcher',
        commissionRate: 0.03,
        commissionAmount: amount * 0.03,
        isRecurring: false,
        dealAmount: amount
      });
    }

    if (client.closedBy) {
      commissions.push({
        earnedBy: client.closedBy,
        commissionRole: 'sales_closer_onetime',
        commissionRate: 0.20,
        commissionAmount: amount * 0.20,
        isRecurring: false,
        dealAmount: amount
      });
    }

    if (client.caPartner) {
      commissions.push({
        earnedBy: client.caPartner,
        commissionRole: 'ca_partner',
        commissionRate: 0.10,
        commissionAmount: amount * 0.10,
        isRecurring: false,
        dealAmount: amount
      });
    }

    if (client.growthHacker) {
      commissions.push({
        earnedBy: client.growthHacker,
        commissionRole: 'growth_hacker',
        commissionRate: 0.02,
        commissionAmount: amount * 0.02,
        isRecurring: false,
        dealAmount: amount
      });
    }
  }

  // ─── ENTERPRISE / ANNUAL DEAL ───
  if (['enterprise', 'annual'].includes(dealType)) {
    const amount = enterpriseAmount;

    if (lead.submittedBy) {
      commissions.push({
        earnedBy: lead.submittedBy,
        commissionRole: 'lead_researcher',
        commissionRate: 0.02,
        commissionAmount: amount * 0.02,
        isRecurring: false,
        dealAmount: amount
      });
    }

    if (client.closedBy) {
      for (let month = 1; month <= 12; month++) {
        commissions.push({
          earnedBy: client.closedBy,
          commissionRole: 'sales_closer_recurring',
          commissionRate: 0.10,
          commissionAmount: amount * 0.10,
          isRecurring: true,
          recurringMonth: month,
          recurringEndMonth: 12,
          dealAmount: amount
        });
      }
      commissions.push({
        earnedBy: client.closedBy,
        commissionRole: 'sales_closer_recurring',
        commissionRate: 0.05,
        commissionAmount: amount * 0.05,
        isRecurring: true,
        recurringMonth: 13,
        recurringEndMonth: 9999,
        dealAmount: amount
      });
    }

    if (client.caPartner) {
      commissions.push({
        earnedBy: client.caPartner,
        commissionRole: 'ca_partner',
        commissionRate: 0.08,
        commissionAmount: amount * 0.08,
        isRecurring: true,
        recurringMonth: 1,
        recurringEndMonth: 9999,
        dealAmount: amount
      });
    }
  }

  return commissions;
}

module.exports = { calculateCommissions };
