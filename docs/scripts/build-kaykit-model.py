"""Bundle the mannequin and compatible animation tracks. Run from any directory."""
import copy
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'kaykit'

def read(name):
    data = (ROOT / name).read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20 + size]), data[28 + size:]

model, binary = read('Mannequin_Medium.glb')
binary = bytearray(binary)
nodes = {node['name']: i for i, node in enumerate(model['nodes']) if 'name' in node}
model['animations'] = []
selections = {
    'Rig_Medium_MovementAdvanced.glb': ['Sneaking'],
    'Rig_Medium_CombatMelee.glb': ['Melee_Unarmed_Attack_Punch_A'],
    'Rig_Medium_General.glb': ['Idle_A', 'Idle_B', 'Hit_A', 'Use_Item', 'Spawn_Ground'],
    'Rig_Medium_MovementBasic.glb': ['Running_A', 'Jump_Full_Short', 'Walking_A', 'Walking_B', 'Walking_C'],
    'Rig_Medium_Simulation.glb': ['Waving', 'Cheering', 'Push_Ups', 'Sit_Ups'],
}
for file, names in selections.items():
    source, data = read(file)
    accessors = {}
    def accessor(index):
        if index in accessors:
            return accessors[index]
        item = copy.deepcopy(source['accessors'][index])
        assert 'sparse' not in item
        view = copy.deepcopy(source['bufferViews'][item['bufferView']])
        start = view.get('byteOffset', 0)
        binary.extend(bytes([0]) * (-len(binary) % 4))
        view['byteOffset'] = len(binary)
        view['buffer'] = 0
        binary.extend(data[start:start + view['byteLength']])
        item['bufferView'] = len(model['bufferViews'])
        model['bufferViews'].append(view)
        accessors[index] = len(model['accessors'])
        model['accessors'].append(item)
        return accessors[index]
    for name in names:
        animation = copy.deepcopy(next(a for a in source['animations'] if a['name'] == name))
        animation['channels'] = [c for c in animation['channels']
                                 if source['nodes'][c['target']['node']]['name'] in nodes]
        for channel in animation['channels']:
            target = source['nodes'][channel['target']['node']]['name']
            if target not in nodes:
                raise ValueError(f'{name}: missing target {target}')
            channel['target']['node'] = nodes[target]
        for sampler in animation['samplers']:
            sampler['input'] = accessor(sampler['input'])
            sampler['output'] = accessor(sampler['output'])
        model['animations'].append(animation)
model['buffers'] = [{'byteLength': len(binary)}]
binary.extend(bytes([0]) * (-len(binary) % 4))
text = json.dumps(model, separators=(',', ':')).encode()
text += b' ' * (-len(text) % 4)
output = struct.pack('<4sII', b'glTF', 2, 28 + len(text) + len(binary))
output += struct.pack('<I4s', len(text), b'JSON') + text
output += struct.pack('<I4s', len(binary), b'BIN' + bytes([0])) + binary
(ROOT / 'Mannequin_Medium_Animated.glb').write_bytes(output)
print(f'Bundled {len(model["animations"])} animations: {len(output):,} bytes')
