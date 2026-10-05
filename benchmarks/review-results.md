# Verifica PR 167

Confronto locale su Windows e Node 22.18.0, con le stesse dipendenze e 1.000 istanze. Base: `1909c146e3ea044345b2b1b2bb2b721c8cf073d5`. PR originale: `434e2fba7d3405301f1cfd05c75625045bc12583`.

La suite completa e il confronto mirato sono stati eseguiti in copie separate, alternando l'ordine delle versioni. Il confronto mirato usa 500 ms per benchmark. Dopo aver ripristinato il controllo precedente dei flag nel culling, quel caso è stato rimisurato separatamente con 2.000 ms.

| Operazione | Base ops/sec | Corretta ops/sec | Variazione |
|---|---:|---:|---:|
| instances/removeInstances | 126582 | 125429 | -0.9% |
| instances/updateInstances | 47222 | 47071 | -0.3% |
| bvh/updateInstancesPosition (move) | 901 | 1115 | 23.8% |
| bvh/setMatrixAt (move) | 4561 | 14640 | 221.0% |
| frustum/linearCulling | 46541 | 46705 | 0.4% |
| frustum/updateIndexArray | 400875 | 488281 | 21.8% |
| sorting/createRadixSort | 38940 | 40767 | 4.7% |

## Correzioni

- Bounding box BVH ricalcolati dalla matrice affine ottimizzata: nessuna deriva da aggiornamenti ripetuti della posizione.
- Ripristinati i flag booleani: entrambe le varianti numeriche misurate erano più lente.
- Copie con indici indipendenti e upload richiesto, anche con renderer inizializzato successivamente.
- Dati morph indipendenti, stato texture ripristinato, skeleton e matrici di bind conservati.
- LOD render e shadow ricostruiti intorno alla copia, con buffer condivisi fra i suoi livelli.
- Crescita e riduzione coerenti dei buffer, compresi morph, bones e nodi BVH.
- Confronto PR/base nello stesso runner CI; errori dei benchmark non vengono più omessi.

## Verifica

`npm run lint` e `npm run build` completati. `node node_modules/vite-node/dist/cli.mjs tests/regressions.ts`: 14 verifiche superate. `npm test` rimane un placeholder.

Il comando del confronto CI è stato provato localmente sia su dati con regressioni sia su dati corretti. La nuova esecuzione GitHub Actions non è stata avviata. I controlli degli indici usano un renderer minimale; la resa WebGL reale e gli FPS nel browser non sono stati verificati.

Rimane il warning Vite preesistente su `__dirname` nella configurazione. La modifica staged originale alla documentazione delle matrici affini è stata conservata.
