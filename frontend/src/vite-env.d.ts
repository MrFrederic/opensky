/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_API_HOST?: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly SSR: boolean;
    [key: string]: string | boolean | undefined;
  };
}
