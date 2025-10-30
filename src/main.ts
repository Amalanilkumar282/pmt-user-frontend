import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { httpClientProvider } from './app/http-client-provider';
import { App } from './app/app';


bootstrapApplication(App, {
  ...appConfig,
  providers: [...(appConfig.providers ?? []), httpClientProvider]
})
  .catch((err) => console.error(err));
