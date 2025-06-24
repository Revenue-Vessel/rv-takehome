import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TerritoryList from '../../components/TerritoryList';

// Mock the fetch API
global.fetch = jest.fn();

const mockSalesReps = [
  {
    id: 1,
    first_name: 'Mike',
    last_name: 'Rodriguez',
    phone_number: '(555) 000-0000',
    email: 'mike.rodriguez@company.com',
    amount_of_deals: 3,
    territory: 'FL'
  },
  {
    id: 2,
    first_name: 'Jennifer',
    last_name: 'Walsh',
    phone_number: '(555) 234-5678',
    email: 'jennifer.walsh@company.com',
    amount_of_deals: 3,
    territory: 'NY'
  },
  {
    id: 3,
    first_name: 'Tom',
    last_name: 'Wilson',
    phone_number: '(555) 000-0000',
    email: 'tom.wilson@company.com',
    amount_of_deals: 2,
    territory: 'NY'
  },
  {
    id: 4,
    first_name: 'Lisa',
    last_name: 'Anderson',
    phone_number: '(555) 123-4567',
    email: 'lisa.anderson@company.com',
    amount_of_deals: 2,
    territory: 'CA'
  }
];

describe('TerritoryList', () => {
  const mockOnTerritoryClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSalesReps
    });
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should render territories after loading', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        expect(screen.getByText('FL')).toBeInTheDocument();
        expect(screen.getByText('NY')).toBeInTheDocument();
        expect(screen.getByText('CA')).toBeInTheDocument();
      });
    });

    it('should render all table columns', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
        expect(screen.getByText('Territory')).toBeInTheDocument();
        expect(screen.getByText('Sales Reps')).toBeInTheDocument();
        expect(screen.getByText('Agent Names')).toBeInTheDocument();
      });
    });
  });

  describe('Territory Grouping', () => {
    it('should group sales reps by territory correctly', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        // Should show territory names
        expect(screen.getByText('FL')).toBeInTheDocument();
        expect(screen.getByText('NY')).toBeInTheDocument();
        expect(screen.getByText('CA')).toBeInTheDocument();
        
        // Should show sales rep counts (use getAllByText since multiple territories can have same count)
        const countElements = screen.getAllByText(/^[12]$/);
        expect(countElements).toHaveLength(3); // 3 territories total
        
        // Should show agent names
        expect(screen.getByText('Mike Rodriguez')).toBeInTheDocument();
        expect(screen.getByText('Jennifer Walsh')).toBeInTheDocument();
        expect(screen.getByText('Tom Wilson')).toBeInTheDocument();
        expect(screen.getByText('Lisa Anderson')).toBeInTheDocument();
      });
    });
  });

  describe('Multi-Select Functionality', () => {
    it('should show select all checkbox', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });
    });

    it('should show individual checkboxes for each territory', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        // Should have select all + 3 territories = 4 checkboxes
        expect(checkboxes).toHaveLength(4);
      });
    });

    it('should show update button when territories are selected', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        // Click the first territory checkbox (index 1, since 0 is select all)
        fireEvent.click(checkboxes[1]);
        
        expect(screen.getByText(/Update Selected \(1\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Territory Click Behavior', () => {
    it('should call onTerritoryClick when territory row is clicked and no selections', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        const nyTerritory = screen.getByText('NY');
        fireEvent.click(nyTerritory);
        
        expect(mockOnTerritoryClick).toHaveBeenCalledWith('NY');
      });
    });

    it('should not call onTerritoryClick when territories are selected', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        // Select a territory
        fireEvent.click(checkboxes[1]);
        
        // Try to click on territory row
        const nyTerritory = screen.getByText('NY');
        fireEvent.click(nyTerritory);
        
        // Should not call onTerritoryClick because selections are active
        expect(mockOnTerritoryClick).not.toHaveBeenCalled();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter territories by search term', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        expect(screen.getByText('NY')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search territories...');
      fireEvent.change(searchInput, { target: { value: 'NY' } });
      
      expect(screen.getByText('NY')).toBeInTheDocument();
      expect(screen.queryByText('CA')).not.toBeInTheDocument();
      expect(screen.queryByText('FL')).not.toBeInTheDocument();
    });

    it('should filter by agent names', async () => {
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        expect(screen.getByText('Mike Rodriguez')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search territories...');
      fireEvent.change(searchInput, { target: { value: 'Mike' } });
      
      expect(screen.getByText('FL')).toBeInTheDocument();
      expect(screen.queryByText('NY')).not.toBeInTheDocument();
      expect(screen.queryByText('CA')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when API call fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error loading territories/)).toBeInTheDocument();
      });
    });

    it('should show error message when API returns error response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });
      
      render(<TerritoryList onTerritoryClick={mockOnTerritoryClick} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error loading territories/)).toBeInTheDocument();
      });
    });
  });
}); 