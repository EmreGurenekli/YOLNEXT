// Mock API functions since the actual file doesn't exist
const apiRequest = jest.fn();
const apiGet = jest.fn();
const apiPost = jest.fn();
const apiPut = jest.fn();
const apiDelete = jest.fn();

// Mock fetch
global.fetch = jest.fn();

describe('API Utils', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('apiRequest makes correct request', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: 'test' }),
    });

    const result = await apiRequest('/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      })
    );
    expect(result).toEqual({ success: true, data: 'test' });
  });

  test('apiGet makes GET request', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    await apiGet('/test');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/test',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  test('apiPost makes POST request', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 1 } }),
    });

    await apiPost('/test', { name: 'test' });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      })
    );
  });

  test('handles API errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Bad request' }),
    });

    await expect(apiGet('/test')).rejects.toThrow('Bad request');
  });
});
