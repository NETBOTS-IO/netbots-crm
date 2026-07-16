import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SuperDashboard from '../SuperDashboard';
import api from '@/lib/api';

// Mock the API and external Chart libraries which require Canvas API
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  }
}));

// We must mock react-chartjs-2 to prevent canvas rendering errors in jsdom
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar" />,
  Line: () => <div data-testid="chart-line" />,
  Doughnut: () => <div data-testid="chart-doughnut" />,
  Pie: () => <div data-testid="chart-pie" />,
  Radar: () => <div data-testid="chart-radar" />,
}));

describe('SuperDashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading skeleton initially', () => {
    // Return a never-resolving promise so loading stays true
    api.get.mockReturnValue(new Promise(() => {}));
    
    const { container } = render(<SuperDashboard />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should fetch data and render dashboard charts and KPIs', async () => {
    api.get.mockResolvedValue({
      success: true,
      data: {
        leadFunnel: { totalLeads: 420 },
        clientHealth: { activeClients: 15 },
        stages: [{ _id: 'identify', count: 10 }]
      }
    });

    render(<SuperDashboard />);

    // Wait for the total leads KPI to appear
    await waitFor(() => {
      expect(screen.getByText('420')).toBeInTheDocument();
    });

    // Verify some chart components are rendered
    expect(screen.getAllByTestId('chart-doughnut').length).toBeGreaterThan(0);
    
    // Verify API was called
    expect(api.get).toHaveBeenCalledWith('/dashboard/super');
  });
});
