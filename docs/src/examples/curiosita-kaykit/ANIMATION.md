## Opening greeting sequence

The companions run out of the fog to positions (2.3, 0, -3) and (-2.3, 0, -4.5),
closer to the protagonist and inside the portrait framing. Running fades into rest.
The hero walks toward the camera while facing it, then turns toward each friend
and waves once: 3.9 and 6.15 seconds. They reply at 4.15 and 6.4 seconds.
The opening walk resolves without a hop. As soon as he reaches his mark, the
hero gives the camera a short greeting wave before turning later toward the two
friends. The hero and the two companions use
slightly different start and finish times: the hero runs, the left companion
walks with Walking_A/B/C, and the right companion also walks at a slower
pace. The three arrivals therefore have distinct rhythms and never move as a
synchronized block.
The hero arrives first; the left walker reaches its mark three seconds later
and the right walking character three seconds after that. Their paths use the
same settling blend as the crowd, so each clip finishes on its actual arrival.
The final collective jump beat has been removed; the ending stays readable while
the hero gives occasional short waves to the camera to bring attention back.
At 8.55 seconds the hero celebrates, but the camera remains locked until the
crowd-call gesture ends at 9.35 seconds.
The distant crowd remains behind a tight fog wall until this reveal, with the
field starting closer to the camera so the first rows read clearly. After the
second friend is greeted, the hero turns directly toward the crowd, gives a
short calling wave, and then celebrates toward them. Once that gesture ends he
stays with the crowd while the camera makes its first move. Only after that
move completes does he turn toward the camera and wave again.
The camera remains front-facing after the celebration; the earlier rightward
micro-truck has been removed so the next motion is the panorama itself.
The pull-back beat no longer inserts a separate backward step. During the
panorama there are two slower details, each held for roughly 2–2.5 seconds: the original trio, then a second
circle of up to six robots selected from the crowd. The second shot begins
wide and performs a gentle dolly toward the circle. In the second detail they
face the centre and loop `Use_Item` as if playing with a shared tool.
The release from that close-up into the full panorama now takes about 1.6 seconds;
the circle keeps playing and holding its inward-facing orientation through the
whole release so nobody snaps away while the camera leaves the dolly.
After the hero completes the crowd-call gesture and turns back toward the camera,
the rest of the field advances from nearer Z positions
into its final layout. Every robot gets a broad staggered entrance, spread over
almost two seconds, followed by a 2.5–2.8 second run using `Running_A`, so the
reveal contains real motion instead
of only a fog fade. The two greeting companions and the later three-person
clearing keep their authored entrances. Movement eases into each destination
and stops 0.42–0.45 seconds before the walking clip ends; that interval blends
back to idle and removes foot sliding. A larger seeded subset waves after
arriving, without a synchronized crowd gesture. During the approach they face
along their path and turn toward the camera as they settle, keeping the entry
readable instead of showing mostly backs.
The authored detail actors use a deeper hidden starting lane, so the three-person
close-up groups cannot be seen before their shots.
Clicking the protagonist or any visible crowd mannequin performs the same short
blended `Hit_A` reaction; the protagonist uses a slightly stronger, longer hit.
The click also runs a 2.55-second disassemble/reassemble gesture. The manual
raycast does not re-enable dragging.
The camera remains still while these nearer walkers settle into the frame. The
initial fog is tight enough to hide the field while the hero arrives, waves and
holds; it begins easing only after that greeting, then expands with the panorama
to reveal the deeper field. As the camera rises, the near fog clears and haze
remains only over the distant rows; it thickens again for the close details.

At the later three-actor detail (`cutAt` → `escalationAt`), the roles are fixed:
the first waves, the second uses the KayKit unarmed punch clip, and the third
repeats a hop. The tool circle uses `Use_Item`. These authored actions continue
for one second after the camera leaves each detail, so the shots can be extended
without a pose snapping back to idle.

There are no repeated greeting cycles. Waves crossfade over 350/450 ms;
the full scene lasts 27.35 seconds. Reduced motion suppresses the gestures and
running, and the crowd keeps its independent breathing rhythms.

# Animation update: fog entrance and varied activities

The scene loads `Mannequin_Medium_Animated.glb`, generated reproducibly with
`python docs/scripts/build-kaykit-model.py`. It contains the original mannequin,
materials and skin plus 16 animation clips, with channels mapped by node name.
Unused attachment-bone channels are omitted. Source GLBs remain available.

The hero starts at Z = -15 and approaches the camera at Z = 15. Its body faces
the camera during the walk, then turns toward the nearby friends. Its head uses
a damped absolute local orientation, replacing clip head sway and the previous
neighbor/crowd glances. During each attention change the head leads first, then
the slower body follow completes the turn.

Other characters select Push_Ups, Sit_Ups, Use_Item, Spawn_Ground, Walking_A,
Walking_B and Walking_C. Sneaking is intentionally unused. Exercises run for three cycles; activity weights blend
into and out of idle over 650/700 ms. Opening walkers use the walking variants.
Ground activities retain the authored head and chest pose. Sneaking comes from Rig_Medium_MovementAdvanced.glb in the supplied KayKit
Character Animations 1.1 download; that source is now included in the project.

Near poses (depth < 65) update every rendered frame; farther poses use 30/20 Hz.
The existing seeded controller, reduced-motion behavior and shared mixer remain.

Validation: run `node docs/scripts/test-kaykit-animation.mjs` against the merged
GLB, and `docs/node_modules/.bin/tsc -p docs/tsconfig.build.json --noEmit`.

---

The following records the earlier controller design; clip selection, hero gaze,
loading and pose cadence are superseded by the update above.

# Living crowd: audit and architecture

> No character is ever dead between actions. There is always a living baseline.

## Evidence and diagnosis

Inspected both root storyboard images, the example source, InstancedMesh2's
skeleton texture upload path, Three.js AnimationAction sampling, and the bundled
Medium GLBs. The storyboards are direction references, not recordings of the
previous implementation. No reference recording was supplied.

A. The previous controller used distance-driven global ripples, modulo-based idle
phases, fixed recurring gesture windows, and frequent camera tracking. Those rules
expose the algorithm instead of producing local causality.

B. The decisive freeze bug was assigning unbounded action.time before
AnimationMixer.update(0). In this sampling mode Three.js does not wrap loop time;
interpolants hold their last value. Reactions also omitted idleTime, and the entire
animation clock stopped at duration + 1.5 seconds. Positive idle weight alone
therefore did not guarantee life.

C. Preserve the merged geometry/material, shared source skeleton/mixer,
InstancedMesh2 bone texture, visibility culling and distance-throttled sampling.
The hero keeps its separate sampler. No library rendering code changed.

D. Performance already provides a reusable pose executor. CrowdDirector provides
semantic state and decisions for the entire crowd, without individual mixers,
skeletons or new controller objects per instance.

E. Every sampled pose carries an advancing baseline phase and preferred idle.
Available action weights are sanitized and normalized; idle fills the remainder.
Looping times are explicitly wrapped. A full-body action may temporarily own the
whole weight budget. Missing idle is a load-time error, not a silent bind pose.

F. Full hops use the entire authored clip, with anticipation and a 240 ms exit
blend begun before the last frame. Waves and cheers use softer entrance/exit
blends. Cooldown gates strong actions, not baseline motion or observation.

G. A global seed and instance ID select persistent traits via independent hash
streams. Decisions have their own sequence counters. No frame randomness enters
behavior. Placement retains its existing independent seed.

H. Build a spatial hash once and retain at most six neighbors inside 14 units.
The radius includes the edge of the opening clearing. Events are probabilistic,
delayed and expire in one pending slot per individual. An action chain is limited
to two neighbor transmissions. Hero events only inspect nearby individuals;
there is no distance-to-time wave function. Walking positions are evaluated at
the decision time so render cadence cannot change event outcomes.

I. The rig contains head, chest and spine, but no separate eye bones or morph
controls. Head offsets use per-individual damping and clamped angles. Sustained
attention can recruit the chest after 450 ms, with a smaller angle and slower
response. Both offsets preserve the authored clip pose. Eye-first motion needs an
asset/material extension and is not claimed here. No procedural foot turning.

J. CPU: fixed 5 Hz decisions, local events, attention state and the existing
shared-mixer bone evaluation. GPU: existing instanced skinning and rendering.
The current renderer is not a GPU animation-clip evaluator; this change does not
pretend otherwise or introduce a new animation texture format.

K. Typed arrays contain traits, action kind/start, cooldown, decision counter/time,
attention target/times, pending reaction and bounded adjacency (about 99 bytes per
individual, in addition to existing instance state). A quaternion and torso yaw
retain attention damping on existing entities. One pose buffer is reused during
visible-instance sampling. Active population is independent of mesh.count, which
is overwritten by visibility culling.

L. The smallest improvement was explicit loop wrapping, continuous baseline time
and an independent life clock. The implementation then adds bounded local
behavior, while preserving camera direction, character assets and render path.

## Available clips

| Semantic role | Asset clip | Duration | Use |
| --- | --- | ---: | --- |
| baseline | Idle_A | 1.067 s | loop |
| alternate baseline | Idle_B | 2.133 s | loop |
| opening locomotion | Running_A | 0.800 s | loop |
| hop | Jump_Full_Short | 1.167 s | complete one-shot |
| greeting | Waving | 2.133 s | one cycle with soft transitions |
| expressive reaction | Cheering | 1.667 s | one cycle with soft transitions |
| available legacy response | Hit_A | 0.667 s | not selected as friendly ambient behavior |

There is no breathing clip in the supplied Medium rigs. Jump_Start and Jump_Land
also exist, but the complete hop already includes anticipation and recovery.
Selected clips have matching first/last keyed values (quaternion signs accounted
for) and no net root translation. This supports looping but does not prove
matching boundary velocities; transitions still require visual judgment.

## Runtime and debugging

The camera clock can finish while lifeTime continues. Hidden tabs suspend updates.
Reduced-motion mode holds the final camera composition and suppresses new strong
actions while keeping the baseline alive. Attention detail fades between depths
50 and 75; pose cadence retains the existing 30/20/15 Hz tiers.

With `?debug` or `#debug`, window.kaykitDebug exposes the director state, seed reset,
seek, pause, instance count, and renderer. Examples:

```js
kaykitDebug.setSeed(72491);
kaykitDebug.director.reactionsEnabled = false;
kaykitDebug.director.playOneShot(0, kaykitDebug.lifeTime);
```

These controls are not exposed in the public interface. Existing sound and camera
cues remain cinematic; per-individual landing audio is not added in this pass.
The director's action kind, source ID, start time and seed are available for a
future spatial sound adapter.

## Verification and limits

Run `node docs/scripts/test-kaykit-animation.mjs` for regression checks using the
real GLB animation tracks: baseline beyond 100 seconds, jump weight continuity,
invalid-weight fallback, no shared gaze contamination, deterministic replay across
render cadences, walking-event determinism, sparse actions and reduced motion.
Run `docs/node_modules/.bin/tsc -p docs/tsconfig.build.json --noEmit` for type checks.

Browser inspection uses a temporary Vite harness with installed local packages,
not the production CDN import map. Desktop and mobile renders were inspected with
a reduced population on software WebGL; full-crowd screenshot capture timed out.
This is not a 25,000-character GPU performance certification. The demo keeps its
existing 8,000 requested maximum and packing limit. No increase in mesh/material
count or per-character skeleton allocation was introduced.
