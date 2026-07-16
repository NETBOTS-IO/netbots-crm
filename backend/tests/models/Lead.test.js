const mongoose = require('mongoose');
const Lead = require('../../models/Lead');

describe('Lead Model Unit Tests', () => {
  it('should be invalid if required fields are missing', () => {
    const lead = new Lead();
    const error = lead.validateSync();
    expect(error.errors.companyName).toBeDefined();
    expect(error.errors.submittedBy).toBeDefined();
  });

  it('should have default temperature as "cold" and default stage as "identify"', () => {
    const lead = new Lead({
      companyName: 'Test Corp',
      submittedBy: new mongoose.Types.ObjectId()
    });
    
    expect(lead.temperature).toBe('cold');
    expect(lead.stage).toBe('identify');
    expect(lead.score).toBe(1); // Score defaults to 1 for cold leads based on schema defaults, though pre-save hook formally sets it.
  });

  it('should validate successfully for a correctly populated lead', async () => {
    const lead = new Lead({
      companyName: 'Hot Leads Inc',
      temperature: 'sql',
      submittedBy: new mongoose.Types.ObjectId()
    });

    const error = lead.validateSync();
    expect(error).toBeUndefined();
  });
});
