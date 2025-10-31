import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

export const httpClientProvider = importProvidersFrom(HttpClientModule);
