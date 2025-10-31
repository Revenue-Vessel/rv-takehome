import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SalesRepSection from '../../components/SalesRepSection';

// Mock the child components
jest.mock('../../components/SalesRepList', () => {
  return function MockSalesRepList({ territoryFilter, initialSearchTerm }: any) {
    return (
      <div data-testid="sales-rep-list">
        <div data-testid="territory-filter">{territoryFilter || 'none'}</div>
        <div data-testid="search-term">{initialSearchTerm || 'none'}</div>
        <div>Sales Rep List Component</div>
      </div>
    );
  };
});

jest.mock('../../components/TerritoryList', () => {
  return function MockTerritoryList({ onTerritoryClick }: any) {
    return (
      <div data-testid="territory-list">
        <div>Territory List Component</div>
        <button 
          data-testid="ny-territory-row"
          onClick={() => onTerritoryClick('NY')}
        >
          NY Territory
        </button>
        <button 
          data-testid="ca-territory-row"
          onClick={() => onTerritoryClick('CA')}
        >
          CA Territory
        </button>
      </div>
    );
  };
});

jest.mock('../../components/SalesRepMap', () => {
  return function MockSalesRepMap() {
    return <div data-testid="sales-rep-map">Map Component</div>;
  };
});

describe('SalesRepSection', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render with Sales Representatives view active by default', () => {
      render(<SalesRepSection />);
      
      // Check that Sales Representatives button is active
      const salesRepButton = screen.getByText('Sales Representatives');
      expect(salesRepButton).toHaveClass('bg-blue-600', 'text-white');
      
      // Check that Map button is inactive
      const mapButton = screen.getByText('Map');
      expect(mapButton).toHaveClass('bg-gray-200', 'text-gray-700');
      
      // Check that "List by sales reps" filter is active
      const listBySalesRepsButton = screen.getByText('List by sales reps');
      expect(listBySalesRepsButton).toHaveClass('text-blue-600', 'font-medium', 'underline');
      
      // Check that "List by territories" filter is inactive
      const listByTerritoriesButton = screen.getByText('List by territories');
      expect(listByTerritoriesButton).toHaveClass('text-gray-600');
    });

    it('should show SalesRepList component by default', () => {
      render(<SalesRepSection />);
      
      expect(screen.getByTestId('sales-rep-list')).toBeInTheDocument();
      expect(screen.queryByTestId('territory-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sales-rep-map')).not.toBeInTheDocument();
    });
  });

  describe('View Toggle Functionality', () => {
    it('should switch to Map view when Map button is clicked', () => {
      render(<SalesRepSection />);
      
      const mapButton = screen.getByText('Map');
      fireEvent.click(mapButton);
      
      // Check that Map button is now active
      expect(mapButton).toHaveClass('bg-blue-600', 'text-white');
      
      // Check that Sales Representatives button is now inactive
      const salesRepButton = screen.getByText('Sales Representatives');
      expect(salesRepButton).toHaveClass('bg-gray-200', 'text-gray-700');
      
      // Check that Map component is shown
      expect(screen.getByTestId('sales-rep-map')).toBeInTheDocument();
      expect(screen.queryByTestId('sales-rep-list')).not.toBeInTheDocument();
    });

    it('should hide filter options when Map view is active', () => {
      render(<SalesRepSection />);
      
      const mapButton = screen.getByText('Map');
      fireEvent.click(mapButton);
      
      // Filter options should not be visible in Map view
      expect(screen.queryByText('List by sales reps')).not.toBeInTheDocument();
      expect(screen.queryByText('List by territories')).not.toBeInTheDocument();
    });
  });

  describe('Filter Toggle Functionality', () => {
    it('should switch to territories view when "List by territories" is clicked', () => {
      render(<SalesRepSection />);
      
      const territoriesButton = screen.getByText('List by territories');
      fireEvent.click(territoriesButton);
      
      // Check that territories filter is now active
      expect(territoriesButton).toHaveClass('text-blue-600', 'font-medium', 'underline');
      
      // Check that sales reps filter is now inactive
      const salesRepsButton = screen.getByText('List by sales reps');
      expect(salesRepsButton).toHaveClass('text-gray-600');
      
      // Check that TerritoryList component is shown
      expect(screen.getByTestId('territory-list')).toBeInTheDocument();
      expect(screen.queryByTestId('sales-rep-list')).not.toBeInTheDocument();
    });

    it('should switch back to sales reps view when "List by sales reps" is clicked', () => {
      render(<SalesRepSection />);
      
      // First switch to territories view
      const territoriesButton = screen.getByText('List by territories');
      fireEvent.click(territoriesButton);
      
      // Then switch back to sales reps view
      const salesRepsButton = screen.getByText('List by sales reps');
      fireEvent.click(salesRepsButton);
      
      // Check that sales reps filter is now active
      expect(salesRepsButton).toHaveClass('text-blue-600', 'font-medium', 'underline');
      
      // Check that territories filter is now inactive
      expect(territoriesButton).toHaveClass('text-gray-600');
      
      // Check that SalesRepList component is shown
      expect(screen.getByTestId('sales-rep-list')).toBeInTheDocument();
      expect(screen.queryByTestId('territory-list')).not.toBeInTheDocument();
    });
  });

  describe('Territory Click Functionality', () => {
    it('should switch to sales reps view and set territory filter when territory row is clicked', async () => {
      render(<SalesRepSection />);
      
      // First switch to territories view
      const territoriesButton = screen.getByText('List by territories');
      fireEvent.click(territoriesButton);
      
      // Click on NY territory row
      const nyTerritoryRow = screen.getByTestId('ny-territory-row');
      fireEvent.click(nyTerritoryRow);
      
      await waitFor(() => {
        // Should switch back to sales reps view
        expect(screen.getByTestId('sales-rep-list')).toBeInTheDocument();
        expect(screen.queryByTestId('territory-list')).not.toBeInTheDocument();
        
        // Should set territory filter to "NY"
        expect(screen.getByTestId('territory-filter')).toHaveTextContent('NY');
        
        // Should not set search term (since we're using territory filter)
        expect(screen.getByTestId('search-term')).toHaveTextContent('none');
      });
      
      // Check that sales reps filter is now active
      const salesRepsButton = screen.getByText('List by sales reps');
      expect(salesRepsButton).toHaveClass('text-blue-600', 'font-medium', 'underline');
    });

    it('should handle different territory clicks correctly', async () => {
      render(<SalesRepSection />);
      
      // First switch to territories view
      const territoriesButton = screen.getByText('List by territories');
      fireEvent.click(territoriesButton);
      
      // Click on CA territory row
      const caTerritoryRow = screen.getByTestId('ca-territory-row');
      fireEvent.click(caTerritoryRow);
      
      await waitFor(() => {
        // Should switch back to sales reps view
        expect(screen.getByTestId('sales-rep-list')).toBeInTheDocument();
        
        // Should set territory filter to "CA"
        expect(screen.getByTestId('territory-filter')).toHaveTextContent('CA');
      });
    });

    it('should clear territory filter when switching to territories view', async () => {
      render(<SalesRepSection />);
      // First switch to territories view and click NY
      const territoriesButton = screen.getByText('List by territories');
      fireEvent.click(territoriesButton);
      const nyTerritoryRow = screen.getByTestId('ny-territory-row');
      fireEvent.click(nyTerritoryRow);
      await waitFor(() => {
        expect(screen.getByTestId('territory-filter')).toHaveTextContent('NY');
      });
      // Switch back to territories view
      fireEvent.click(territoriesButton);
      // Now switch back to sales reps view to check the filter is cleared
      const salesRepsButton = screen.getByText('List by sales reps');
      fireEvent.click(salesRepsButton);
      await waitFor(() => {
        expect(screen.getByTestId('territory-filter')).toHaveTextContent('none');
      });
    });
  });

  describe('Component Integration', () => {
    it('should maintain correct state through multiple interactions', async () => {
      render(<SalesRepSection />);
      
      // Start with sales reps view
      expect(screen.getByTestId('sales-rep-list')).toBeInTheDocument();
      expect(screen.getByTestId('territory-filter')).toHaveTextContent('none');
      
      // Switch to territories view
      const territoriesButton = screen.getByText('List by territories');
      fireEvent.click(territoriesButton);
      expect(screen.getByTestId('territory-list')).toBeInTheDocument();
      
      // Click NY territory
      const nyTerritoryRow = screen.getByTestId('ny-territory-row');
      fireEvent.click(nyTerritoryRow);
      
      await waitFor(() => {
        expect(screen.getByTestId('sales-rep-list')).toBeInTheDocument();
        expect(screen.getByTestId('territory-filter')).toHaveTextContent('NY');
      });
      
      // Switch to Map view
      const mapButton = screen.getByText('Map');
      fireEvent.click(mapButton);
      expect(screen.getByTestId('sales-rep-map')).toBeInTheDocument();
      
      // Switch back to Sales Representatives view
      const salesRepButton = screen.getByText('Sales Representatives');
      fireEvent.click(salesRepButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('sales-rep-list')).toBeInTheDocument();
        // Territory filter should still be "NY" from previous interaction
        expect(screen.getByTestId('territory-filter')).toHaveTextContent('NY');
      });
    });
  });
}); 