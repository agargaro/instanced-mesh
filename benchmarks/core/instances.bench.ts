import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { COUNT, createMesh, positionEntity, seedInstances } from '../shared.js';

export function registerInstancesBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  const ids = Array.from({ length: COUNT }, (_, i) => i);

  bench.add('instances/addInstances', () => {
    mesh.addInstances(COUNT, positionEntity);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
    }
  });

  bench.add('instances/addInstances (growth)', () => {
    mesh.addInstances(COUNT, positionEntity);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT >> 1, false);
    }
  });

  bench.add('instances/addInstances (entities)', () => {
    mesh.addInstances(COUNT, positionEntity);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, true);
    }
  });

  bench.add('instances/removeInstances', () => {
    mesh.removeInstances(...ids);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    }
  });

  bench.add('instances/updateInstances', () => {
    mesh.updateInstances((obj, index) => {
      obj.position.set(index % 128, (index * 7) % 128, (index * 13) % 128);
    });
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    }
  });

  bench.add('instances/updateInstancesPosition', () => {
    mesh.updateInstancesPosition((obj, index) => {
      obj.position.set(index % 128, (index * 7) % 128, (index * 13) % 128);
    });
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    }
  });

  bench.add('instances/updateInstances (entities)', () => {
    mesh.updateInstances((obj, index) => {
      obj.position.set(index % 128, (index * 7) % 128, (index * 13) % 128);
    });
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, true);
      seedInstances(mesh);
    }
  });
}
