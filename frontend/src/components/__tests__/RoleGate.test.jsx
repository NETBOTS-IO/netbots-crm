import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import RoleGate from '../RoleGate';
import { useAuth } from '@/context/AuthContext';

// Mock useAuth context
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('RoleGate Component Unit Tests', () => {
  it('should render children if user has required permission', () => {
    useAuth.mockReturnValue({
      user: {
        permissions: { can_view_leads: true },
      },
      hasPermission: (perm) => perm === 'can_view_leads',
    });

    render(
      <RoleGate permission="can_view_leads">
        <div data-testid="child-element">Authorized Content</div>
      </RoleGate>
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  it('should render AccessDenied component if user lacks permission', () => {
    useAuth.mockReturnValue({
      user: {
        permissions: { can_view_leads: false },
      },
      hasPermission: () => false,
    });

    render(
      <MemoryRouter>
        <RoleGate permission="can_view_leads" action="View Leads">
          <div data-testid="child-element">Authorized Content</div>
        </RoleGate>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('child-element')).not.toBeInTheDocument();
    // Assuming AccessDenied renders the action text passed
    expect(screen.getByText(/View Leads/i)).toBeInTheDocument();
  });
});
