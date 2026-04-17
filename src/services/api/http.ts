import axios from 'axios';

export const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function createResponse<T>(
  code: string,
  message: string,
  data?: T,
): {code: string; message: string; data?: T} {
  return {code, message, data};
}
