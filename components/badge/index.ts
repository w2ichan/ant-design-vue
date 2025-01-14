import { App } from 'vue';
import Badge from './Badge';

/* istanbul ignore next */
Badge.install = function(app: App) {
  app.component(Badge.name, Badge);
  return app;
};

export default Badge;
