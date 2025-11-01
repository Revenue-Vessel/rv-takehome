// Mock Next.js server components before importing
jest.mock("next/server", () => {
  const mockNextRequest = jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || "GET",
    json: jest.fn().mockImplementation(() => {
      try {
        return Promise.resolve(JSON.parse(options?.body || "{}"));
      } catch (error) {
        return Promise.reject(new Error("Invalid JSON"));
      }
    }),
    text: jest.fn().mockResolvedValue(options?.body || ""),
  }));

  const mockNextResponse = {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
    })),
  };

  return {
    NextRequest: mockNextRequest,
    NextResponse: mockNextResponse,
  };
});

// Mock the data source and repository
jest.mock("../../data-source");
jest.mock("../../lib/entities/deals/Deal");

const { NextRequest } = require("next/server");
const { GET } = require("../../app/api/analytics/forecast/route");
const { initializeDataSource } = require("../../data-source");

const mockInitializeDataSource = initializeDataSource as jest.MockedFunction<
  typeof initializeDataSource
>;

describe("/api/analytics/forecast", () => {
  let mockRepository: any;
  let mockDataSource: any;

  const createMockDeal = (overrides = {}) => ({
    deal_id: "DEAL-001",
    company_name: "Test Company",
    contact_name: "John Doe",
    transportation_mode: "trucking" as const,
    stage: "qualified" as const,
    value: 100000,
    probability: 75,
    created_date: "2024-01-01T00:00:00Z",
    updated_date: "2024-01-01T00:00:00Z",
    expected_close_date: "2025-07-15T00:00:00Z",
    sales_rep: "Jane Smith",
    origin_city: "New York",
    destination_city: "Los Angeles",
    cargo_type: "Electronics",
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    mockInitializeDataSource.mockResolvedValue(mockDataSource);
    jest.clearAllMocks();

    // Mock current date to 2025-06-18 for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-18T00:00:00Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("GET /api/analytics/forecast", () => {
    describe("Basic functionality", () => {
      it("should return forecast with deals closing in future months", async () => {
        const mockDeals = [
          createMockDeal({
            deal_id: "DEAL-001",
            value: 100000,
            probability: 80,
            expected_close_date: "2025-07-15T00:00:00Z",
            stage: "qualified",
            transportation_mode: "trucking",
          }),
          createMockDeal({
            deal_id: "DEAL-002",
            value: 50000,
            probability: 60,
            expected_close_date: "2025-08-20T00:00:00Z",
            stage: "proposal",
            transportation_mode: "rail",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.forecast).toBeDefined();
        expect(data.forecast["2025-07"]).toBeDefined();
        expect(data.forecast["2025-08"]).toBeDefined();
        expect(data.forecast["2025-07"].deals).toContain("DEAL-001");
        expect(data.forecast["2025-08"].deals).toContain("DEAL-002");
      });

      it("should calculate forecasted revenue using probability", async () => {
        const mockDeals = [
          createMockDeal({
            deal_id: "DEAL-001",
            value: 100000,
            probability: 50,
            expected_close_date: "2025-07-15T00:00:00Z",
            stage: "qualified",
            transportation_mode: "trucking",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        // 100000 * 0.5 * 1 (default win rate) = 50000
        expect(data.forecast["2025-07"].forecasted_revenue).toBe(50000);
      });

      it("should include quarter information", async () => {
        const mockDeals = [
          createMockDeal({
            deal_id: "DEAL-001",
            expected_close_date: "2025-07-15T00:00:00Z",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(data.forecast["2025-07"].quarter).toBe("2025-Q3");
      });
    });

    describe("Win rate calculations", () => {
      it("should calculate win rates based on historical closed deals", async () => {
        const mockDeals = [
          // Historical closed deals for trucking
          createMockDeal({
            deal_id: "HIST-001",
            stage: "closed_won",
            transportation_mode: "trucking",
            expected_close_date: "2025-01-15T00:00:00Z",
          }),
          createMockDeal({
            deal_id: "HIST-002",
            stage: "closed_lost",
            transportation_mode: "trucking",
            expected_close_date: "2025-02-15T00:00:00Z",
          }),
          // Future deal
          createMockDeal({
            deal_id: "FUTURE-001",
            stage: "qualified",
            transportation_mode: "trucking",
            value: 100000,
            probability: 100,
            expected_close_date: "2025-07-15T00:00:00Z",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        // Win rate for trucking should be 0.5 (1 won, 1 lost)
        // Forecasted revenue: 100000 * 1.0 * 0.5 = 50000
        expect(data.forecast["2025-07"].forecasted_revenue).toBe(50000);
      });

      it("should use default win rate of 1 when no historical data", async () => {
        const mockDeals = [
          createMockDeal({
            deal_id: "DEAL-001",
            stage: "qualified",
            transportation_mode: "ocean",
            value: 100000,
            probability: 80,
            expected_close_date: "2025-07-15T00:00:00Z",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        // No historical data for ocean, so win rate = 1
        // Forecasted revenue: 100000 * 0.8 * 1 = 80000
        expect(data.forecast["2025-07"].forecasted_revenue).toBe(80000);
      });
    });

    describe("Date filtering", () => {
      it("should only include deals closing from now until end of next quarter", async () => {
        const mockDeals = [
          // Past deal - should be excluded
          createMockDeal({
            deal_id: "PAST-001",
            expected_close_date: "2025-05-15T00:00:00Z",
          }),
          // Current period deal - should be included
          createMockDeal({
            deal_id: "CURRENT-001",
            expected_close_date: "2025-07-15T00:00:00Z",
          }),
          // Far future deal - should be excluded (beyond next quarter)
          createMockDeal({
            deal_id: "FAR-001",
            expected_close_date: "2026-01-15T00:00:00Z",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        
        // Should only have the current period deal
        const allDeals = Object.values(data.forecast).flatMap((month: any) => month.deals);
        expect(allDeals).toContain("CURRENT-001");
        expect(allDeals).not.toContain("PAST-001");
        expect(allDeals).not.toContain("FAR-001");
      });

      it("should pre-populate all months from now until end of next quarter", async () => {
        mockRepository.find.mockResolvedValue([]);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        
        // Should have entries for June 2025 through March 2026 (end of next quarter)
        const months = Object.keys(data.forecast);
        expect(months).toContain("2025-06");
        expect(months).toContain("2025-07");
        expect(months).toContain("2025-08");
        expect(months).toContain("2025-09");
      });
    });

    describe("Edge cases", () => {
      it("should handle deals with missing required fields", async () => {
        const mockDeals = [
          createMockDeal({
            deal_id: "INCOMPLETE-001",
            expected_close_date: null,
          }),
          createMockDeal({
            deal_id: "INCOMPLETE-002",
            value: null,
          }),
          createMockDeal({
            deal_id: "INCOMPLETE-003",
            probability: null,
          }),
          createMockDeal({
            deal_id: "VALID-001",
            expected_close_date: "2025-07-15T00:00:00Z",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        
        // Only the valid deal should be included
        const allDeals = Object.values(data.forecast).flatMap((month: any) => month.deals);
        expect(allDeals).toContain("VALID-001");
        expect(allDeals).not.toContain("INCOMPLETE-001");
        expect(allDeals).not.toContain("INCOMPLETE-002");
        expect(allDeals).not.toContain("INCOMPLETE-003");
      });

      it("should return message when no deals are forecasted", async () => {
        const mockDeals = [
          // Only past deals
          createMockDeal({
            deal_id: "PAST-001",
            expected_close_date: "2025-01-15T00:00:00Z",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe(
          "No deals expected to close from now until the end of next quarter. Please check your data or add upcoming deals."
        );
        expect(data.forecast).toBeDefined();
      });

      it("should handle empty database", async () => {
        mockRepository.find.mockResolvedValue([]);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe(
          "No deals expected to close from now until the end of next quarter. Please check your data or add upcoming deals."
        );
      });

      it("should handle multiple deals in same month", async () => {
        const mockDeals = [
          createMockDeal({
            deal_id: "DEAL-001",
            value: 50000,
            probability: 80,
            expected_close_date: "2025-07-15T00:00:00Z",
          }),
          createMockDeal({
            deal_id: "DEAL-002",
            value: 30000,
            probability: 60,
            expected_close_date: "2025-07-25T00:00:00Z",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.forecast["2025-07"].deals).toContain("DEAL-001");
        expect(data.forecast["2025-07"].deals).toContain("DEAL-002");
        // 50000 * 0.8 * 1 + 30000 * 0.6 * 1 = 40000 + 18000 = 58000
        expect(data.forecast["2025-07"].forecasted_revenue).toBe(58000);
      });
    });

    describe("Transportation mode variations", () => {
      it("should calculate different win rates for different transportation modes", async () => {
        const mockDeals = [
          // Historical data for different modes
          createMockDeal({
            deal_id: "HIST-TRUCK-WON",
            stage: "closed_won",
            transportation_mode: "trucking",
          }),
          createMockDeal({
            deal_id: "HIST-RAIL-LOST",
            stage: "closed_lost",
            transportation_mode: "rail",
          }),
          // Future deals
          createMockDeal({
            deal_id: "FUTURE-TRUCK",
            stage: "qualified",
            transportation_mode: "trucking",
            value: 100000,
            probability: 100,
            expected_close_date: "2025-07-15T00:00:00Z",
          }),
          createMockDeal({
            deal_id: "FUTURE-RAIL",
            stage: "qualified",
            transportation_mode: "rail",
            value: 100000,
            probability: 100,
            expected_close_date: "2025-07-15T00:00:00Z",
          }),
        ];

        mockRepository.find.mockResolvedValue(mockDeals);

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        // Trucking win rate: 1.0 (1 won, 0 lost)
        // Rail win rate: 0.0 (0 won, 1 lost)
        // Total forecasted: 100000 * 1.0 * 1.0 + 100000 * 1.0 * 0.0 = 100000
        expect(data.forecast["2025-07"].forecasted_revenue).toBe(100000);
      });
    });

    describe("Error handling", () => {
      it("should handle database connection errors", async () => {
        mockInitializeDataSource.mockRejectedValue(
          new Error("Database connection failed")
        );

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });

      it("should handle database query errors", async () => {
        mockRepository.find.mockRejectedValue(new Error("Query failed"));

        const request = new NextRequest("http://localhost:3000/api/analytics/forecast");
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });
    });
  });
});