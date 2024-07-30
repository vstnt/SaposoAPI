/*
|--------------------------------------------------------------------------
| JavaScript entrypoint for running ace commands
|--------------------------------------------------------------------------
|
| DO NOT MODIFY THIS FILE AS IT WILL BE OVERRIDDEN DURING THE BUILD
| PROCESS.
|
| See docs.adonisjs.com/guides/typescript-build-process#creating-production-build
|
| Since, we cannot run TypeScript source code using "node" binary, we need
| a JavaScript entrypoint to run ace commands.
|
| This file registers the "ts-node/esm" hook with the Node.js module system
| and then imports the "bin/console.ts" file.
|
*/

/**
 * Register hook to process TypeScript files using ts-node
 */
//import { register } from 'node:module'
//register('ts-node/esm', import.meta.url)
import 'ts-node/register';

/*A abordagem anterior está tentando usar o módulo nativo node:module para registrar
 o ts-node/esm. O problema aqui é que a API de módulos do Node.js pode não estar
  configurada da forma esperada para lidar com esse tipo de registro, especialmente
   no contexto de um ambiente de build como o Render. Assim, trocamos ela por sugestão do gpt para
   tentar resolver o erro de módulo não encontrado no deploy do Render.*/

/**
 * Import ace console entrypoint
 */
await import('./bin/console.js')
