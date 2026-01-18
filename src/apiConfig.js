const isProduction = process.env.NODE_ENV === 'production';

export const API_URL = isProduction ? '/api' : 'http://localhost:5000/api';
