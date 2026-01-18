// API Configuration
// In production (Netlify), API calls go to serverless functions at /.netlify/functions/
// In development, use localhost backend server
const isProduction = process.env.NODE_ENV === 'production';

export const API_URL = isProduction
    ? '/api'  // Netlify will redirect /api/* to /.netlify/functions/*
    : 'http://localhost:5000/api';
