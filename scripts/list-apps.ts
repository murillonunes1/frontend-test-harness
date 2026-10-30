/** Lista as apps configuradas. Com --json, imprime um array (usado pela matriz do CI). */
import { listApps, loadApp } from '../config/load';

const apps = listApps();
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(apps));
} else {
  for (const name of apps) {
    const app = await loadApp(name);
    console.log(
      `${name.padEnd(20)} ambientes: ${Object.keys(app.environments).join(', ')}  rotas: ${app.routes.length}`,
    );
  }
}
