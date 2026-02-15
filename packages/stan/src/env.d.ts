declare global {
  namespace NodeJS {
    interface ProcessEnv {
      STAN_VERSION: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {};
