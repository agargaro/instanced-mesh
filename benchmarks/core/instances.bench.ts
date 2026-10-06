import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { COUNT, createMesh, positionEntity, seedInstances } from '../shared.js';

export function registerInstancesBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  const ids = Array.from({ length: COUNT }, (_, i) => i);
  for (const entities of [false, true]) {
    bench.add(`instances/addInstances/identity/entities=${entities}`, () => mesh.addInstances(COUNT), {
      beforeEach: () => { mesh = createMesh(COUNT, entities); },
      afterEach: () => mesh.dispose()
    });
    for (const sparse of [false, true]) {
      bench.add(`instances/updateInstancesPosition/entities=${entities}/sparse=${sparse}`, () => mesh.updateInstancesPosition(positionEntity), {
        beforeAll: () => {
          mesh = createMesh(COUNT, entities);
          seedInstances(mesh);
          if (sparse) mesh.removeInstances(...ids.filter((i) => i % 2 === 0));
        },
        afterAll: () => mesh.dispose()
      });
    }
  }

  bench.add('instances/addInstances', () => {
    mesh.addInstances(COUNT, positionEntity);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
    },
    afterEach: () => mesh.dispose()
  });

  bench.add('instances/addInstances (growth)', () => {
    mesh.addInstances(COUNT, positionEntity);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT >> 1, false);
    },
    afterEach: () => mesh.dispose()
  });

  bench.add('instances/addInstances (entities)', () => {
    mesh.addInstances(COUNT, positionEntity);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, true);
    },
    afterEach: () => mesh.dispose()
  });

  bench.add('instances/removeInstances', () => {
    mesh.removeInstances(...ids);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    },
    afterEach: () => mesh.dispose()
  });

  bench.add('instances/updateInstances', () => {
    mesh.updateInstances((obj, index) => {
      obj.position.set(index % 128, (index * 7) % 128, (index * 13) % 128);
    });
  }, {
    beforeAll: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    },
    afterAll: () => mesh.dispose()
  });

  bench.add('instances/updateInstancesPosition', () => {
    mesh.updateInstancesPosition((obj, index) => {
      obj.position.set(index % 128, (index * 7) % 128, (index * 13) % 128);
    });
  }, {
    beforeAll: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    },
    afterAll: () => mesh.dispose()
  });

  bench.add('instances/updateInstances (entities)', () => {
    mesh.updateInstances((obj, index) => {
      obj.position.set(index % 128, (index * 7) % 128, (index * 13) % 128);
    });
  }, {
    beforeAll: () => {
      mesh = createMesh(COUNT, true);
      seedInstances(mesh);
    },
    afterAll: () => mesh.dispose()
  });
}
