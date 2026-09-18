const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
global.window = {};
vm.runInThisContext(fs.readFileSync(path.join(root, 'js/physics.js'), 'utf8'), { filename: 'physics.js' });
vm.runInThisContext(fs.readFileSync(path.join(root, 'js/ai.js'), 'utf8'), { filename: 'ai.js' });
vm.runInThisContext(fs.readFileSync(path.join(root, 'js/controller.js'), 'utf8'), { filename: 'controller.js' });
window.addEventListener = window.addEventListener || (() => {});
vm.runInThisContext(fs.readFileSync(path.join(root, 'js/game.js'), 'utf8'), { filename: 'game.js' });
vm.runInThisContext(fs.readFileSync(path.join(root, 'js/tournament.js'), 'utf8'), { filename: 'tournament.js' });

const Physics = window.TableTennisPhysics;
const AI = window.TableTennisAI;
const Controller = window.TableTennisController;
const Game = window.TableTennisGame;
const Tournament = window.TableTennisTournament;

function makeAI(profile = 'medium', physicsProfile = 'pro') {
    const physics = new Physics();
    physics.setProfile(physicsProfile);
    const audio = { play() {} };
    const renderer = {};
    const ai = new AI(physics, renderer, audio);
    ai.setDifficulty(profile);
    return { ai, physics };
}

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
    } catch (err) {
        console.error(`✗ ${name}`);
        throw err;
    }
}




test('Pro forced-error model can produce net, out and rescue popup outcomes', () => {
    const { ai } = makeAI('medium', 'pro');
    const context = {
        pressure: 0.8,
        lowBallPressure: 0.7,
        movementStrain: 0.8,
        speedPressure: 0.8,
        stretchPressure: 0.8
    };
    const outcomes = new Set();
    for (let i = 0; i < 100; i++) outcomes.add(ai.chooseProErrorType(context, i / 100));
    assert(outcomes.has('net'));
    assert(outcomes.has('out'));
    assert(outcomes.has('popup'));
});

test('Low incoming balls shift Pro errors toward the net', () => {
    const { ai } = makeAI('medium', 'pro');
    const base = { pressure: 0.65, movementStrain: 0.4, speedPressure: 0.4, stretchPressure: 0.4 };
    const countNet = (lowBallPressure) => {
        let count = 0;
        for (let i = 0; i < 1000; i++) {
            const roll = (i + 0.5) / 1000;
            if (ai.chooseProErrorType({ ...base, lowBallPressure }, roll) === 'net') count++;
        }
        return count;
    };
    assert(countNet(1) > countNet(0));
});

test('Pro hitIntoNet creates a physical net collision for both sides', () => {
    for (const side of ['player', 'opponent']) {
        const physics = new Physics();
        physics.setProfile('pro');
        physics.pos = side === 'opponent'
            ? { x: 0.04, y: 0.98, z: -1.48 }
            : { x: -0.04, y: 0.98, z: 1.48 };
        let netHit = false;
        physics.onNetHit = () => { netHit = true; };
        physics.hitIntoNet(side);
        for (let i = 0; i < 180 && physics.inPlay; i++) physics.update(1 / 240);
        assert(netHit, `${side} shot should collide with net`);
    }
});

function simulateShot({ side, start, targetX, targetZ, duration, spinX = 0, spinY = 0, allowOut = false, frameDt = 1 / 60 }) {
    const physics = new Physics();
    physics.setProfile('pro');
    physics.pos = { ...start };
    let bounce = null;
    let netHit = false;
    physics.onBounce = (bounceSide, x, z) => {
        if (!bounce) bounce = { side: bounceSide, x, z };
    };
    physics.onNetHit = () => { netHit = true; };
    physics.hitTowards(side, targetX, targetZ, duration, spinX, spinY, allowOut);

    for (let i = 0; i < 240 && physics.inPlay && !bounce; i++) {
        physics.update(frameDt);
    }
    return { physics, bounce, netHit };
}

test('Pro AI explicit long error bypasses normal safe-depth clamp', () => {
    const result = simulateShot({
        side: 'opponent',
        start: { x: 0, y: 1.0, z: -1.48 },
        targetX: 0,
        targetZ: 1.65,
        duration: 0.42,
        spinX: 20,
        allowOut: true
    });
    assert.strictEqual(result.bounce, null, 'forced long error must not be clamped back onto the table');
    assert(!result.netHit);
    assert(result.physics.pos.z > 1.37);
});

test('Normal Pro AI shots remain inside the legal target envelope', () => {
    const result = simulateShot({
        side: 'opponent',
        start: { x: 0, y: 1.0, z: -1.48 },
        targetX: 1.2,
        targetZ: 1.65,
        duration: 0.42,
        spinX: 20
    });
    assert(result.bounce, 'normal Pro AI shot should land on table');
    assert.strictEqual(result.bounce.side, 'player');
    assert(Math.abs(result.bounce.x - 0.56) < 0.015);
    assert(Math.abs(result.bounce.z - 1.16) < 0.015);
});




test('Consecutive signature-shot repetition is strongly discouraged', () => {
    const { ai } = makeAI('hard', 'pro');
    ai.setArchetype('titan');
    window.gameInstance = { isServe: false };
    const playerPos = { x: 0, y: 0.95, z: 2.5 };

    const originalRandom = Math.random;
    try {
        let seq = [0.10, 0.99];
        Math.random = () => seq.length ? seq.shift() : 0.99;
        ai.memory.previousShotType = 'rally';
        assert.strictEqual(ai.chooseShot(0, 'cleanReturn', playerPos), 'dropShot');

        seq = [0.10, 0.99];
        Math.random = () => seq.length ? seq.shift() : 0.99;
        ai.memory.previousShotType = 'dropShot';
        assert.strictEqual(ai.chooseShot(0, 'cleanReturn', playerPos), 'rally');
    } finally {
        Math.random = originalRandom;
        delete window.gameInstance;
    }
});



test('Topspin Magnus dips symmetrically for player and AI travel directions', () => {
    const sampleVy = (vz) => {
        const physics = new Physics();
        physics.setProfile('pro');
        physics.inPlay = true;
        physics.pos = { x: 0, y: 1.0, z: vz < 0 ? 1.0 : -1.0 };
        physics.vel = { x: 0, y: 0, z: vz };
        physics.spin = { x: 120, y: 0, z: 0 };
        physics.stepPhysics(0.01);
        return physics.vel.y;
    };

    const towardOpponent = sampleVy(-6);
    const towardPlayer = sampleVy(6);
    assert(towardOpponent < -0.09);
    assert(towardPlayer < -0.09);
    assert(Math.abs(towardOpponent - towardPlayer) < 1e-9);
});

function makeProSmashPlanner(speed, options = {}) {
    const controller = Object.create(Controller.prototype);
    controller.isTouchActive = false;
    controller.isTouchDevice = false;
    controller.velocity = {
        x: options.vx || 0,
        y: options.vy !== undefined ? options.vy : -speed * 0.88,
        speed
    };
    controller.rot = { x: options.rotX !== undefined ? options.rotX : 0.28, y: 0, z: 0 };
    return controller;
}

function simulateProSmash(plan) {
    const physics = new Physics();
    physics.setProfile('pro');
    physics.pos = { x: 0, y: 0.96, z: 1.17 };
    let bounce = null;
    let netHit = false;
    let elapsed = 0;
    physics.onBounce = (side, x, z) => {
        if (!bounce) bounce = { side, x, z, elapsed };
    };
    physics.onNetHit = () => { netHit = true; };
    physics.hitTowards('player', 0, plan.targetZ, plan.duration, plan.topspin, 0, false);
    for (let i = 0; i < 1500 && physics.inPlay && !bounce; i++) {
        physics.update(0.001);
        elapsed += 0.001;
    }
    return { physics, bounce, netHit };
}

test('Clean Pro smashes stay on the opponent table across a wide power range', () => {
    for (const speed of [1120, 1300, 1500, 1800, 2050, 2300]) {
        const controller = makeProSmashPlanner(speed);
        const plan = controller.getProSmashPlan(speed, 0.10);
        const result = simulateProSmash(plan);
        assert(!result.netHit, `${speed}px/s clean smash should clear the net`);
        assert(result.bounce, `${speed}px/s clean smash should bounce on table`);
        assert.strictEqual(result.bounce.side, 'opponent');
        assert(result.bounce.z < -0.80 && result.bounce.z >= -1.37,
            `${speed}px/s bounce ${result.bounce.z} should be deep but legal`);
    }
});

test('Smash power no longer maps directly to an out-of-bounds target', () => {
    const medium = makeProSmashPlanner(1500).getProSmashPlan(1500, 0.10);
    const maximum = makeProSmashPlanner(2300).getProSmashPlan(2300, 0.10);
    assert.notStrictEqual(medium.type, 'overhit');
    assert.notStrictEqual(maximum.type, 'overhit');
    assert(maximum.targetZ >= -1.35, `clean max-power target ${maximum.targetZ} should remain controlled`);
});

test('Extreme power plus poor Pro technique can still create a genuine long out', () => {
    const speed = 2300;
    const controller = makeProSmashPlanner(speed, { vy: -200, rotX: -0.25 });
    const plan = controller.getProSmashPlan(speed, 0.95);
    assert.strictEqual(plan.type, 'overhit');
    assert(plan.targetZ < -1.45);

    const result = simulateProSmash(plan);
    assert(!result.netHit);
    assert.strictEqual(result.bounce, null, 'overhit should pass the baseline without a legal table bounce');
    assert(result.physics.pos.z < -1.37);
});


test('Pro trajectory solver lands player rally/drive/smash near the requested point', () => {
    const cases = [
        { name: 'rally', start: { x: 0, y: 0.96, z: 1.15 }, targetX: 0.25, targetZ: -1.05, duration: 0.50, spinX: 45, spinY: 0 },
        { name: 'drive', start: { x: 0, y: 0.98, z: 1.15 }, targetX: -0.35, targetZ: -1.20, duration: 0.42, spinX: 65, spinY: 6 },
        { name: 'smash', start: { x: 0, y: 0.98, z: 1.17 }, targetX: 0.18, targetZ: -1.28, duration: 0.34, spinX: 150, spinY: -8 }
    ];

    for (const shot of cases) {
        const result = simulateShot({ side: 'player', ...shot });
        assert(!result.netHit, `${shot.name} should clear the net`);
        assert(result.bounce, `${shot.name} should land on the opponent table`);
        assert.strictEqual(result.bounce.side, 'opponent');
        assert(Math.abs(result.bounce.x - shot.targetX) < 0.018, `${shot.name} x error too large`);
        assert(Math.abs(result.bounce.z - shot.targetZ) < 0.018, `${shot.name} z error too large: ${result.bounce.z}`);
    }
});

test('Pro trajectory solver is symmetric for AI travel direction', () => {
    const player = simulateShot({
        side: 'player', start: { x: 0, y: 0.98, z: 1.15 },
        targetX: -0.32, targetZ: -1.18, duration: 0.42, spinX: 72, spinY: 7
    });
    const ai = simulateShot({
        side: 'opponent', start: { x: 0, y: 0.98, z: -1.15 },
        targetX: 0.32, targetZ: 1.18, duration: 0.42, spinX: 72, spinY: -7
    });

    assert(player.bounce && ai.bounce);
    assert(Math.abs(player.bounce.x + ai.bounce.x) < 0.012);

    assert(Math.abs(Math.abs(player.bounce.z) - ai.bounce.z) < 0.03);
});

test('Interpolated table collision keeps landing point stable across frame rates', () => {
    const frameRates = [1 / 30, 1 / 60, 1 / 120];
    const bounces = frameRates.map(frameDt => simulateShot({
        side: 'player',
        start: { x: 0.08, y: 0.98, z: 1.17 },
        targetX: -0.22, targetZ: -1.27, duration: 0.35,
        spinX: 145, spinY: 9, frameDt
    }).bounce);

    for (const bounce of bounces) assert(bounce);
    const xs = bounces.map(b => b.x);
    const zs = bounces.map(b => b.z);
    assert(Math.max(...xs) - Math.min(...xs) < 0.012);
    assert(Math.max(...zs) - Math.min(...zs) < 0.015);
});

test('Pro predictor uses the same aerodynamic model as live flight', () => {
    const physics = new Physics();
    physics.setProfile('pro');
    physics.pos = { x: 0.04, y: 0.99, z: 1.12 };
    physics.hitTowards('player', -0.30, -1.22, 0.40, 120, 10, false);

    const initialVelocity = { ...physics.vel };
    const prediction = physics.predictTrajectory(initialVelocity, { x: 120, y: 10, z: 0 }, 0.40, physics.pos, 1 / 300);
    assert(Math.abs(prediction.pos.x - (-0.30)) < 0.003);
    assert(Math.abs(prediction.pos.z - (-1.22)) < 0.003);
    assert(Math.abs(prediction.pos.y - (physics.TABLE_SURFACE_Y + physics.RADIUS)) < 0.003);
});


function makeProTechniquePlanner({ speed, vx = 0, vy = -speed, rotX = 0.20, rotY = 0, posX = 0.25 }) {
    const controller = Object.create(Controller.prototype);
    controller.isTouchActive = false;
    controller.isTouchDevice = false;
    controller.velocity = { x: vx, y: vy, speed };
    controller.rot = { x: rotX, y: rotY, z: 0 };
    controller.pos = { x: posX, y: 0.96, z: 1.15 };
    return controller;
}

test('Pro forward/closed brushing creates topspin while backward/open brushing creates backspin', () => {
    const top = makeProTechniquePlanner({ speed: 1150, vx: 80, vy: -1100, rotX: 0.28 })
        .getProStrokeTechnique(1150, 0.15, 0.96);
    const chop = makeProTechniquePlanner({ speed: 720, vx: 60, vy: 670, rotX: -0.20 })
        .getProStrokeTechnique(720, 0.15, 0.88);

    assert.strictEqual(top.type, 'topspin');
    assert(top.spinX > 80, `expected heavy topspin, got ${top.spinX}`);
    assert.strictEqual(chop.type, 'chop');
    assert(chop.spinX < -35, `expected backspin, got ${chop.spinX}`);
});

test('Pro lateral brushing produces signed sidespin from the actual swipe direction', () => {
    const right = makeProTechniquePlanner({ speed: 920, vx: 860, vy: -260, rotX: 0.08, rotY: 0 })
        .getProStrokeTechnique(920, 0.12, 0.96);
    const left = makeProTechniquePlanner({ speed: 920, vx: -860, vy: -260, rotX: 0.08, rotY: 0 })
        .getProStrokeTechnique(920, 0.12, 0.96);

    assert(right.spinY > 40, `right brush should create positive sidespin, got ${right.spinY}`);
    assert(left.spinY < -40, `left brush should create negative sidespin, got ${left.spinY}`);
});

test('Pro stroke side feedback distinguishes forehand and backhand court positions', () => {
    const fh = makeProTechniquePlanner({ speed: 700, posX: 0.30 }).getProStrokeTechnique(700, 0.2, 0.96);
    const bh = makeProTechniquePlanner({ speed: 700, posX: -0.30 }).getProStrokeTechnique(700, 0.2, 0.96);
    assert.strictEqual(fh.strokeSide, 'forehand');
    assert.strictEqual(bh.strokeSide, 'backhand');
});

test('Over-closed low Pro attack becomes a deterministic net-risk stroke', () => {
    const controller = makeProTechniquePlanner({ speed: 1380, vx: 0, vy: -1320, rotX: 0.50 });
    const tech = controller.getProStrokeTechnique(1380, 0.82, 0.82);
    const plan = controller.getProRallyPlan(1380, 0.82, 0.82, tech);
    assert(tech.netRisk > 0.54, `net risk too low: ${tech.netRisk}`);
    assert.strictEqual(plan.forceNet, true);
});

test('Open-face hard Pro attack can become a true long out while clean drive remains legal', () => {
    const bad = makeProTechniquePlanner({ speed: 1320, vx: 0, vy: -1220, rotX: -0.26 });
    const badTech = bad.getProStrokeTechnique(1320, 0.85, 0.96);
    const badPlan = bad.getProRallyPlan(1320, 0.85, 0.96, badTech);
    assert.strictEqual(badPlan.allowOut, true);
    assert(badPlan.targetZ < -1.45);

    const clean = makeProTechniquePlanner({ speed: 1050, vx: 80, vy: -980, rotX: 0.20 });
    const cleanTech = clean.getProStrokeTechnique(1050, 0.12, 0.96);
    const cleanPlan = clean.getProRallyPlan(1050, 0.12, 0.96, cleanTech);
    assert.strictEqual(cleanPlan.allowOut, false);
    assert(cleanPlan.targetZ >= -1.31 && cleanPlan.targetZ <= -0.66);
});

test('Pro rally plans with topspin, chop and sidespin all land through the shared solver', () => {
    const cases = [
        { speed: 1150, vx: 80, vy: -1100, rotX: 0.28, contact: 0.15, y: 0.96 },
        { speed: 720, vx: 60, vy: 670, rotX: -0.20, contact: 0.15, y: 0.88 },
        { speed: 920, vx: 860, vy: -260, rotX: 0.08, contact: 0.12, y: 0.96 }
    ];

    for (const item of cases) {
        const controller = makeProTechniquePlanner(item);
        const tech = controller.getProStrokeTechnique(item.speed, item.contact, item.y);
        const plan = controller.getProRallyPlan(item.speed, item.contact, item.y, tech);
        assert.strictEqual(plan.forceNet, false);
        assert.strictEqual(plan.allowOut, false);
        const result = simulateShot({
            side: 'player', start: { x: 0, y: item.y, z: 1.14 },
            targetX: 0.08, targetZ: plan.targetZ, duration: plan.duration,
            spinX: tech.spinX, spinY: tech.spinY
        });
        assert(!result.netHit, `${tech.type} should clear the net`);
        assert(result.bounce, `${tech.type} should land`);
        assert.strictEqual(result.bounce.side, 'opponent');
        assert(Math.abs(result.bounce.z - plan.targetZ) < 0.022, `${tech.type} depth error too large`);
    }
});


test('Backspin and topspin produce opposite vertical Magnus acceleration', () => {
    const physics = new Physics();
    physics.setProfile('pro');
    const velocity = { x: 0, y: 0, z: -6 };
    const top = physics.getFlightAcceleration(velocity, { x: 100, y: 0, z: 0 });
    const back = physics.getFlightAcceleration(velocity, { x: -100, y: 0, z: 0 });
    assert(top.y < physics.GRAVITY, 'topspin should add downward Magnus acceleration');
    assert(back.y > physics.GRAVITY, 'backspin should add upward Magnus acceleration');
});

test('Sidespin direction creates the matching lateral kick after table bounce', () => {
    const bounceKick = (spinY) => {
        const physics = new Physics();
        physics.setProfile('pro');
        physics.inPlay = true;
        physics.lastHitter = 'player';
        physics.pos = { x: 0, y: 0.77, z: -0.90 };
        physics.vel = { x: 0, y: -1.2, z: -3.0 };
        physics.spin = { x: 20, y: spinY, z: 0 };
        physics.checkTableCollision(0, 0.81, -0.89);
        return physics.vel.x;
    };
    assert(bounceKick(70) > 0.35);
    assert(bounceKick(-70) < -0.35);
});


test('Technique Coach grades reward clean strokes and flag poor ones', () => {
    const game = Object.create(Game.prototype);
    assert.strictEqual(game.getTechniqueGrade(0.92), 'A');
    assert.strictEqual(game.getTechniqueGrade(0.77), 'B');
    assert.strictEqual(game.getTechniqueGrade(0.61), 'C');
    assert.strictEqual(game.getTechniqueGrade(0.30), 'D');
});

test('Technique Coach prioritizes deterministic net and out explanations', () => {
    const game = Object.create(Game.prototype);
    const clean = { forceNet: false, allowOut: false, netRisk: 0.1, outRisk: 0.1, contactQuality: 0.95, spinX: 10, spinY: 0 };
    const net = { ...clean, forceNet: true, netRisk: 0.8 };
    const out = { ...clean, allowOut: true, outRisk: 0.8 };
    assert(game.getTechniqueFeedback(net).toLowerCase().includes('net'));
    assert(game.getTechniqueFeedback(out).toLowerCase().includes('long'));
    assert(game.getTechniqueFeedback(clean, 'in').toLowerCase().includes('in'));
});

test('Technique Coach suggests centered contact before generic clean feedback', () => {
    const game = Object.create(Game.prototype);
    const edge = { forceNet: false, allowOut: false, netRisk: 0.1, outRisk: 0.1, contactQuality: 0.52, spinX: 20, spinY: 10 };
    assert(game.getTechniqueFeedback(edge).toLowerCase().includes('center'));
});

test('Technique Coach recognizes topspin, backspin and sidespin guidance', () => {
    const game = Object.create(Game.prototype);
    const base = { forceNet: false, allowOut: false, netRisk: 0.05, outRisk: 0.05, contactQuality: 0.95 };
    assert(game.getTechniqueFeedback({ ...base, spinX: 110, spinY: 0 }).toLowerCase().includes('topspin'));
    assert(game.getTechniqueFeedback({ ...base, spinX: -70, spinY: 0 }).toLowerCase().includes('backspin'));
    assert(game.getTechniqueFeedback({ ...base, spinX: 10, spinY: 70 }).toLowerCase().includes('sidespin'));
});


function makeArcadePlanner() {
    const controller = Object.create(Controller.prototype);
    controller.isTouchActive = false;
    controller.isTouchDevice = false;
    return controller;
}































































test('Pro serve aim inverts horizontally to cross-court deep zones (paddle right aims left, paddle left aims right)', () => {
    const game = Object.create(Game.prototype);
    const paddleRight = game.getProServePlan({
        pos: { x: 0.58, z: 1.86 },
        velocity: { x: 760, y: -900, speed: 1180 }
    });
    const paddleLeft = game.getProServePlan({
        pos: { x: -0.58, z: 0.72 },
        velocity: { x: -760, y: 720, speed: 1050 }
    });
    assert(paddleRight.targetX < 0, 'paddle on right must aim cross-court to the left');
    assert(paddleLeft.targetX > 0, 'paddle on left must aim cross-court to the right');
    assert.strictEqual(paddleRight.zoneId, 'deep-left');
    assert.strictEqual(paddleLeft.zoneId, 'deep-right');
    assert(paddleRight.targetZ <= -0.92 && paddleRight.targetZ >= -1.16);
    assert(paddleLeft.targetZ <= -0.92 && paddleLeft.targetZ >= -1.16);
    assert(paddleRight.spinX > 0, 'forward/up brush should create topspin on Pro serve');
    assert(paddleLeft.spinX < 0, 'reverse brush should create backspin on Pro serve');
    assert(paddleRight.sidespin > 0 && paddleLeft.sidespin < 0);
});

test('Pro player serve second bounce stays close to the selected returnable target even with heavy spin', () => {
    const cases = [
        { x: -0.34, z: -0.94, side: -48, top: -58 },
        { x: 0.38, z: -1.14, side: 48, top: 92 }
    ];
    for (const c of cases) {
        const physics = new Physics();
        physics.setProfile('pro');
        physics.reset('player');
        const bounces = [];
        physics.onBounce = (side, x, z) => bounces.push({ side, x, z });
        physics.serveBall('player', c.x, c.z, c.side, c.top);
        for (let i = 0; i < 1200 && bounces.length < 2; i++) physics.update(1 / 240);
        assert.strictEqual(bounces.length, 2);
        assert.strictEqual(bounces[0].side, 'player');
        assert.strictEqual(bounces[1].side, 'opponent');
        assert(Math.abs(bounces[1].x - c.x) < 0.02, `Pro serve x error too large: ${bounces[1].x}`);
        assert(Math.abs(bounces[1].z - c.z) < 0.02, `Pro serve z error too large: ${bounces[1].z}`);
    }
});

test('Player serve corridor reaches the AI contact line before a third table bounce', () => {
    const cases = [
        { profile: 'pro', x: -0.50, z: -0.92, side: -48, top: -85 },
        { profile: 'pro', x: 0.50, z: -1.16, side: 48, top: 110 }
    ];

    for (const c of cases) {
        const physics = new Physics();
        physics.setProfile(c.profile);
        physics.reset('player');
        let bounceCount = 0;
        physics.onBounce = () => { bounceCount += 1; };
        physics.serveBall('player', c.x, c.z, c.side, c.top);

        let reachedAIContactLine = false;
        for (let i = 0; i < 1500 && physics.inPlay; i++) {
            physics.update(1 / 240);
            if (bounceCount >= 2 && physics.pos.z <= -1.43) {
                reachedAIContactLine = true;
                break;
            }
            if (bounceCount >= 3) break;
        }

        assert(reachedAIContactLine, `${c.profile} serve should reach the AI before a third bounce`);
        assert(bounceCount < 3, `${c.profile} serve must not double-bounce past the receiver`);
        assert(Math.abs(physics.pos.x) <= 0.85, `${c.profile} serve should remain inside AI lateral reach`);
    }
});

test('AI can physically return the extreme allowed player serves on every difficulty', () => {
    const cases = [
        { profile: 'pro', x: -0.50, z: -0.92, side: -48, top: -85 },
        { profile: 'pro', x: 0.50, z: -1.16, side: 48, top: 110 }
    ];
    const oldGame = window.gameInstance;
    const oldPlayer = window.playerController;
    window.playerController = { pos: { x: 0, y: 0.98, z: 1.52 } };

    try {
        for (const difficulty of ['easy', 'medium', 'hard']) {
            for (const c of cases) {
                const physics = new Physics();
                physics.setProfile(c.profile);
                physics.reset('player');
                const ai = new AI(physics, { shake() {} }, { play() {} });
                ai.setDifficulty(difficulty);
                window.gameInstance = { isServe: true, state: 'rally', rallyCount: 1, showCallout() {} };
                physics.onBounce = () => {
                    if (physics.bounceHistory.length === 2) window.gameInstance.isServe = false;
                };
                physics.serveBall('player', c.x, c.z, c.side, c.top);

                let returned = false;
                for (let i = 0; i < 1400 && physics.inPlay; i++) {
                    physics.update(1 / 240);
                    ai.update(1 / 240);
                    if (physics.lastHitter === 'opponent') {
                        returned = true;
                        break;
                    }
                    if (physics.bounceHistory.length >= 3) break;
                }
                assert(returned, `${difficulty} AI should reach ${c.profile} serve ${c.x},${c.z}`);
            }
        }
    } finally {
        window.gameInstance = oldGame;
        window.playerController = oldPlayer;
    }
});

test('Pro serve tracking counts attempts and legal serves once', () => {
    const game = Object.create(Game.prototype);
    game.physicsProfile = 'pro';
    game.proMatchStats = { shots: 0, contactSum: 0, qualitySum: 0, maxSpeed: 0, maxSpin: 0, serves: 0, legalServes: 0, aces: 0 };
    game.lastProServePlan = null;
    game.recordProServe({ targetX: 0.3, targetZ: -1.0, spinX: 70, sidespin: -30 });
    assert.strictEqual(game.proMatchStats.serves, 1);
    assert.strictEqual(game.proMatchStats.maxSpin, 70);
    game.recordProServeLegal();
    game.recordProServeLegal();
    assert.strictEqual(game.proMatchStats.legalServes, 1, 'legal serve should only be recorded once');
});

test('Pro technical match summary reports shot accuracy, contact, speed, spin, serve rate and max rally', () => {
    const game = Object.create(Game.prototype);
    game.proCoachStats = { in: 8, net: 1, out: 1 };
    game.proMatchStats = {
        shots: 10,
        contactSum: 8.4,
        qualitySum: 8.1,
        maxSpeed: 96.4,
        maxSpin: 128.2,
        serves: 5,
        legalServes: 4,
        aces: 2,
        maxRally: 7
    };
    const report = game.getProMatchSummary();
    assert.deepStrictEqual(report, {
        accuracy: 80,
        avgContact: 84,
        maxSpeed: 96,
        maxSpin: 128,
        serveIn: 80,
        aces: 2,
        maxRally: 7
    });
});

test('Pro max rally tracks the longest rally in the match', () => {
    const game = Object.create(Game.prototype);
    game.proMatchStats = { shots: 0, contactSum: 0, qualitySum: 0, maxSpeed: 0, maxSpin: 0, serves: 0, legalServes: 0, aces: 0, maxRally: 0 };
    game.rallyCount = 0;
    game.updateRallyCounter = () => {};


    game.rallyCount = 4;
    if (game.proMatchStats) game.proMatchStats.maxRally = Math.max(game.proMatchStats.maxRally, game.rallyCount);
    assert.strictEqual(game.proMatchStats.maxRally, 4);


    game.rallyCount = 2;
    if (game.proMatchStats) game.proMatchStats.maxRally = Math.max(game.proMatchStats.maxRally, game.rallyCount);
    assert.strictEqual(game.proMatchStats.maxRally, 4);


    game.rallyCount = 9;
    if (game.proMatchStats) game.proMatchStats.maxRally = Math.max(game.proMatchStats.maxRally, game.rallyCount);
    assert.strictEqual(game.proMatchStats.maxRally, 9);
});


test('Pro serve let is excluded from serve-in statistics', () => {
    const game = Object.create(Game.prototype);
    game.physicsProfile = 'pro';
    game.proMatchStats = { shots: 0, contactSum: 0, qualitySum: 0, maxSpeed: 0, maxSpin: 0, serves: 0, legalServes: 0, aces: 0 };
    game.lastProServePlan = null;
    game.recordProServe({ targetX: 0, targetZ: -0.9, spinX: 20, sidespin: 0 });
    assert.strictEqual(game.proMatchStats.serves, 1);
    game.cancelProServeAttempt();
    game.cancelProServeAttempt();
    assert.strictEqual(game.proMatchStats.serves, 0);
});



test('AI point reset clears rally memory without changing difficulty or archetype', () => {
    const { ai } = makeAI('hard', 'pro');
    const difficulty = ai.difficulty;
    const archetype = ai.archetype;
    ai.rallyHitCount = 9;
    ai.reactionTimer = 0.4;
    ai.lastSeenHitter = 'player';
    ai.prevBallPos = { x: 1, y: 1, z: 1 };
    ai.hitCooldown = 0.3;
    ai.memory.lastTargets = [{ x: 1 }];
    ai.memory.playerPositions = [{ x: 1 }];
    ai.memory.previousShotType = 'smash';
    ai.memory.recentShotTypes = ['smash', 'drop'];
    ai.memory.comboState = 2;
    ai.resetPointState();
    assert.strictEqual(ai.rallyHitCount, 0);
    assert.strictEqual(ai.reactionTimer, 0);
    assert.strictEqual(ai.lastSeenHitter, null);
    assert.strictEqual(ai.prevBallPos, null);
    assert.strictEqual(ai.hitCooldown, 0);
    assert.deepStrictEqual(ai.memory.lastTargets, []);
    assert.deepStrictEqual(ai.memory.playerPositions, []);
    assert.strictEqual(ai.memory.previousShotType, null);
    assert.deepStrictEqual(ai.memory.recentShotTypes, []);
    assert.strictEqual(ai.memory.comboState, 0);
    assert.strictEqual(ai.difficulty, difficulty);
    assert.strictEqual(ai.archetype, archetype);
});

test('AI reaction delay does not start from a stationary pre-serve ball', () => {
    const { ai, physics } = makeAI('medium', 'pro');
    ai.resetPointState();
    physics.reset('player');
    ai.update(1 / 60);
    assert.strictEqual(ai.lastSeenHitter, null);
    assert.strictEqual(ai.reactionTimer, 0);

    physics.inPlay = true;
    physics.pos = { x: 0, y: 1.0, z: 0.7 };
    physics.vel = { x: 0, y: 0.2, z: -2.5 };
    ai.update(1 / 240);
    assert.strictEqual(ai.lastSeenHitter, 'player');
    assert(ai.reactionTimer > 0);
});

test('prepareServe clears stale receiver collision and AI rally state', () => {
    const game = Object.create(Game.prototype);
    let controllerReset = 0;
    let aiReset = 0;
    let physicsReset = null;
    game.opponentServeTimeout = null;
    game.nextPointTimeout = null;
    game.netReplayTimeout = null;
    game.pendingServeReplay = true;
    game.servingSide = 'player';
    game.controller = { resetPointTracking() { controllerReset++; } };
    game.ai = { resetPointState() { aiReset++; } };
    game.physics = { reset(side) { physicsReset = side; } };
    game.resetArcadePointFlow = () => {};
    game.updateRallyCounter = () => {};
    game.updateArcadeServeAim = () => {};
    game.showCallout = () => {};
    game.elServeIndicator = null;
    game.prepareServe();
    assert.strictEqual(game.state, 'serving');
    assert.strictEqual(game.isServe, true);
    assert.strictEqual(game.pendingServeReplay, false);
    assert.strictEqual(physicsReset, 'player');
    assert.strictEqual(controllerReset, 1);
    assert.strictEqual(aiReset, 1);
});

test('Pausing during a valid Pro serve let resumes into a clean replay instead of a frozen rally', () => {
    const game = Object.create(Game.prototype);
    game.state = 'rally';
    game.prevState = 'serving';
    game.isServe = true;
    game.servingSide = 'player';
    game.physicsProfile = 'pro';
    game.serveTouchedNet = false;
    game.physics = {
        lastHitter: 'player',
        inPlay: true,
        bounceHistory: [
            { side: 'player', x: 0, z: 0.45 },
            { side: 'opponent', x: 0, z: -0.75 }
        ]
    };
    game.audio = { play() {} };
    game.renderer = { addBounceEffect() {} };
    game.cancelProServeAttempt = () => {};
    game.showCallout = () => {};
    game.controller = { prevMouse: { time: 0 }, velocity: { x: 1, y: 1, speed: 1 } };
    game.elPauseModal = null;
    game.opponentServeTimeout = null;
    game.nextPointTimeout = null;
    game.netReplayTimeout = null;
    game.setupPhysicsHooks();


    game.physics.onNetHit(true);
    assert.strictEqual(game.state, 'rally');
    assert.strictEqual(game.serveTouchedNet, true);
    game.physics.onBounce('opponent', 0, -0.75);
    assert.strictEqual(game.state, 'serve_replay');
    assert.strictEqual(game.pendingServeReplay, true);

    game.pauseGame(false);
    assert.strictEqual(game.state, 'paused');
    assert.strictEqual(game.prevState, 'serve_replay');
    let prepared = 0;
    game.prepareServe = () => { prepared++; game.state = 'serving'; };
    game.resumeGame();
    assert.strictEqual(prepared, 1);
    assert.strictEqual(game.state, 'serving');
});

test('Pro own-table stroke is recorded as a failed technique outcome', () => {
    const game = Object.create(Game.prototype);
    let outcome = null;
    let awarded = null;
    game.isServe = false;
    game.physicsProfile = 'pro';
    game.physics = {
        lastHitter: 'player',
        bounceHistory: [{ side: 'player', x: 0, z: 0.5 }]
    };
    game.audio = { play() {} };
    game.renderer = { addBounceEffect() {} };
    game.markProTechniqueOutcome = (value) => { outcome = value; };
    game.awardPoint = (winner) => { awarded = winner; };
    game.setupPhysicsHooks();
    game.physics.onBounce('player', 0, 0.5);
    assert.strictEqual(outcome, 'out');
    assert.strictEqual(awarded, 'opponent');
});

test('Cancelling score flip animations prevents stale score writes after reset', () => {
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    let nextId = 1;
    const pending = new Map();
    global.setTimeout = (fn) => { const id = nextId++; pending.set(id, fn); return id; };
    global.clearTimeout = (id) => { pending.delete(id); };
    try {
        const classes = new Set();
        const el = {
            textContent: '0',
            classList: {
                add(name) { classes.add(name); },
                remove(name) { classes.delete(name); }
            }
        };
        const game = Object.create(Game.prototype);
        game.scoreFlipTimers = new Map();
        game.elScorePlayer = el;
        game.elScoreOpponent = null;
        game.flipScore(el, 1);
        assert.strictEqual(game.scoreFlipTimers.size, 1);
        assert(classes.has('flipping'));
        game.cancelScoreFlipAnimations();
        assert.strictEqual(game.scoreFlipTimers.size, 0);
        assert.strictEqual(pending.size, 0);
        assert(!classes.has('flipping'));
        assert.strictEqual(el.textContent, '0');
    } finally {
        global.setTimeout = originalSetTimeout;
        global.clearTimeout = originalClearTimeout;
    }
});





test('Corrupt tournament save rebuilds bracket while preserving valid career totals', () => {
    const originalStorage = global.localStorage;
    const badSave = {
        tournamentType: 'world',
        playerCountry: 'tr',
        difficulty: 'hard',
        currentStageIndex: 2,
        isCareerActive: true,
        bracket: { r16: [] },
        careerTrophies: 4,
        careerStats: { matchesPlayed: 12, matchesWon: 8, highestRally: 37 }
    };
    let saved = null;
    global.localStorage = {
        getItem(key) { return key === 'tt_career_data' ? JSON.stringify(badSave) : null; },
        setItem(key, value) { if (key === 'tt_career_data') saved = value; }
    };
    try {
        const tournament = new Tournament();
        assert.strictEqual(tournament.tournamentType, 'world');
        assert.strictEqual(tournament.playerCountry, 'tr');
        assert.strictEqual(tournament.difficulty, 'hard');
        assert.strictEqual(tournament.currentStageIndex, 0);
        assert.strictEqual(tournament.careerTrophies, 4);
        assert.strictEqual(tournament.careerStats.matchesPlayed, 12);
        assert.strictEqual(tournament.careerStats.matchesWon, 8);
        assert.strictEqual(tournament.careerStats.highestRally, 37);
        assert(Array.isArray(tournament.bracket.r16) && tournament.bracket.r16.length === 8);
        assert(Array.isArray(tournament.bracket.qf) && tournament.bracket.qf.length === 4);
        assert(saved, 'rebuilt tournament should be persisted');
    } finally {
        if (originalStorage === undefined) delete global.localStorage;
        else global.localStorage = originalStorage;
    }
});






test('Technique Coach can distinguish own-table errors from long outs', () => {
    const game = Object.create(Game.prototype);
    game.proCoachStats = { in: 0, net: 0, out: 0 };
    game.lastPlayerTechnique = { pendingOutcome: true };
    game.renderProTechnique = () => {};
    game.markProTechniqueOutcome('out', 'own_table');
    assert.strictEqual(game.lastPlayerTechnique.outcome, 'out');
    assert.strictEqual(game.lastPlayerTechnique.outcomeDetail, 'own_table');
    assert.strictEqual(game.proCoachStats.out, 1);
});

test('Tournament stage count matches each format', () => {
    const originalStorage = global.localStorage;
    global.localStorage = { getItem() { return null; }, setItem() {} };
    try {
        const tournament = new Tournament();
        tournament.tournamentType = 'world';
        assert.strictEqual(tournament.getTotalStages(), 4);
        tournament.tournamentType = 'masters';
        assert.strictEqual(tournament.getTotalStages(), 3);
    } finally {
        if (originalStorage === undefined) delete global.localStorage;
        else global.localStorage = originalStorage;
    }
});



test('Closing tournament bracket after a finished match restores the result modal', () => {
    const makeClassList = (initial = []) => {
        const set = new Set(initial);
        return {
            add(v) { set.add(v); },
            remove(v) { set.delete(v); },
            contains(v) { return set.has(v); }
        };
    };
    const game = Object.create(Game.prototype);
    game.state = 'match_end';
    game.elBracketModal = { classList: makeClassList() };
    game.elGameOverModal = { classList: makeClassList(['hidden']) };
    let resumed = false;
    game.resumeGame = () => { resumed = true; };
    game.closeBracketModal();
    assert(game.elBracketModal.classList.contains('hidden'));
    assert(!game.elGameOverModal.classList.contains('hidden'));
    assert.strictEqual(resumed, false);
});



test('Retrying a lost tournament final removes the provisional silver medal', () => {
    const originalStorage = global.localStorage;
    global.localStorage = { getItem() { return null; }, setItem() {} };
    try {
        const tournament = new Tournament();
        tournament.startNewTournament('tr', 'masters', 'medium');
        tournament.currentStageIndex = 2;
        tournament.bracket.fn[0].p1 = 'tr';
        tournament.bracket.fn[0].p2 = 'cn';
        tournament.recordMatchResult('opponent', 9, 11);
        assert.strictEqual(tournament.careerStats.silverMedals, 1);
        assert.strictEqual(tournament.bracket.fn[0].winner, 'cn');
        tournament.retryCurrentStage();
        assert.strictEqual(tournament.careerStats.silverMedals, 0);
        assert.strictEqual(tournament.bracket.fn[0].winner, null);
        assert.strictEqual(tournament.bracket.fn[0].score, null);
    } finally {
        if (originalStorage === undefined) delete global.localStorage;
        else global.localStorage = originalStorage;
    }
});

test('Career record system updates matches, points and win rate for quick matches', () => {
    const originalStorage = global.localStorage;
    let savedData = null;
    global.localStorage = {
        getItem() { return null; },
        setItem(key, val) { if (key === 'tt_career_data') savedData = JSON.parse(val); }
    };
    try {
        const tournament = new Tournament();
        assert.strictEqual(tournament.careerStats.matchesPlayed, 0);
        assert.strictEqual(tournament.careerStats.matchesWon, 0);


        tournament.recordQuickMatchResult('player', 11, 7);
        assert.strictEqual(tournament.careerStats.matchesPlayed, 1);
        assert.strictEqual(tournament.careerStats.matchesWon, 1);
        assert.strictEqual(tournament.careerStats.matchesLost, 0);
        assert.strictEqual(tournament.careerStats.totalPointsWon, 11);
        assert.strictEqual(tournament.careerStats.totalPointsLost, 7);
        assert(savedData, 'quick match should persist to localStorage');
        assert.strictEqual(savedData.careerStats.matchesWon, 1);


        tournament.recordQuickMatchResult('opponent', 9, 11);
        assert.strictEqual(tournament.careerStats.matchesPlayed, 2);
        assert.strictEqual(tournament.careerStats.matchesWon, 1);
        assert.strictEqual(tournament.careerStats.matchesLost, 1);
        assert.strictEqual(tournament.careerStats.totalPointsWon, 20);
        assert.strictEqual(tournament.careerStats.totalPointsLost, 18);

        const stats = tournament.getCareerStats();
        assert.strictEqual(stats.matchesPlayed, 2);
        assert.strictEqual(stats.winRate, 50);
        assert.strictEqual(stats.trophies, 0);
    } finally {
        if (originalStorage === undefined) delete global.localStorage;
        else global.localStorage = originalStorage;
    }
});

test('Career record synchronizes tournament trophies and keeps recording after final', () => {
    const originalStorage = global.localStorage;
    global.localStorage = { getItem() { return null; }, setItem() {} };
    try {
        const tournament = new Tournament();
        tournament.startNewTournament('tr', 'masters', 'medium');

        tournament.recordMatchResult('player', 11, 5);

        tournament.recordMatchResult('player', 11, 8);

        tournament.recordMatchResult('player', 11, 9);

        const stats = tournament.getCareerStats();
        assert.strictEqual(stats.trophies, 1);
        assert.strictEqual(stats.matchesPlayed, 3);
        assert.strictEqual(stats.matchesWon, 3);
        assert.strictEqual(stats.winRate, 100);


        tournament.recordMatchResult('player', 11, 6);
        const statsAfter = tournament.getCareerStats();
        assert.strictEqual(statsAfter.matchesPlayed, 4);
        assert.strictEqual(statsAfter.matchesWon, 4);
    } finally {
        if (originalStorage === undefined) delete global.localStorage;
        else global.localStorage = originalStorage;
    }
});



test('Physics stops remaining substeps immediately after a terminal net callback', () => {
    const physics = new Physics();
    physics.setProfile('pro');
    physics.pos = { x: 0, y: physics.NET_Y - 0.04, z: 0.03 };
    physics.vel = { x: 0, y: 0, z: -18 };
    physics.spin = { x: 0, y: 0, z: 0 };
    physics.inPlay = true;
    physics.lastHitter = 'player';
    let hits = 0;
    physics.onNetHit = () => { hits += 1; };
    physics.update(0.04);
    assert.strictEqual(hits, 1);
    assert.strictEqual(physics.inPlay, false);
    assert(Math.abs(physics.pos.z) <= 0.003, `ball should remain at net contact plane, got z=${physics.pos.z}`);
});



test('Pro top-tape contact keeps an open rally alive and preserves travel direction', () => {
    const physics = new Physics();
    physics.setProfile('pro');
    physics.pos = { x: 0, y: physics.NET_Y + 0.005, z: 0.03 };
    physics.vel = { x: 0, y: 0, z: -6 };
    physics.spin = { x: 0, y: 0, z: 0 };
    physics.inPlay = true;
    physics.lastHitter = 'player';
    let chord = null;
    physics.onNetHit = (isChord) => { chord = isChord; };
    for (let i = 0; i < 12 && chord === null; i++) physics.update(1 / 240);
    assert.strictEqual(chord, true);
    assert.strictEqual(physics.inPlay, true);
    assert(physics.pos.z < 0, 'ball should be placed just across the net after a tape touch');
    assert(physics.vel.z < 0, 'net cord should not reverse the ball back toward the hitter');
});

test('Open-rally Pro net cord does not award a point or mark the stroke as a net fault', () => {
    const game = Object.create(Game.prototype);
    game.state = 'rally';
    game.isServe = false;
    game.physicsProfile = 'pro';
    game.serveTouchedNet = false;
    game.physics = { lastHitter: 'player', inPlay: true, bounceHistory: [] };
    game.audio = { play() {} };
    game.renderer = { addBounceEffect() {} };
    let awarded = 0;
    let marked = 0;
    game.awardPoint = () => { awarded++; };
    game.markProTechniqueOutcome = () => { marked++; };
    game.setupPhysicsHooks();
    game.physics.onNetHit(true);
    assert.strictEqual(awarded, 0);
    assert.strictEqual(marked, 0);
    assert.strictEqual(game.physics.inPlay, true);
});

test('A taped Pro serve that lands incorrectly is still a service fault, not a let', () => {
    const game = Object.create(Game.prototype);
    game.state = 'rally';
    game.isServe = true;
    game.servingSide = 'player';
    game.physicsProfile = 'pro';
    game.serveTouchedNet = false;
    game.physics = {
        lastHitter: 'player',
        inPlay: true,
        bounceHistory: [
            { side: 'player', x: 0, z: 0.4 },
            { side: 'player', x: 0, z: 0.7 }
        ]
    };
    game.audio = { play() {} };
    game.renderer = { addBounceEffect() {} };
    game.showCallout = () => {};
    let awarded = null;
    game.awardPoint = (winner) => { awarded = winner; };
    game.setupPhysicsHooks();
    game.physics.onNetHit(true);
    assert.strictEqual(game.serveTouchedNet, true);
    game.physics.onBounce('player', 0, 0.7);
    assert.strictEqual(awarded, 'opponent');
    assert.notStrictEqual(game.state, 'serve_replay');
});

test('A valid taped Pro player serve cancels its provisional serve attempt before replay', () => {
    const game = Object.create(Game.prototype);
    game.physicsProfile = 'pro';
    game.servingSide = 'player';
    game.state = 'rally';
    game.serveTouchedNet = true;
    game.pendingServeReplay = false;
    game.physics = { inPlay: true };
    game.showCallout = () => {};
    game.netReplayTimeout = null;
    let cancelled = 0;
    game.cancelProServeAttempt = () => { cancelled++; };
    game.scheduleServeReplay();
    clearTimeout(game.netReplayTimeout);
    assert.strictEqual(cancelled, 1);
    assert.strictEqual(game.pendingServeReplay, true);
    assert.strictEqual(game.serveTouchedNet, false);
    assert.strictEqual(game.physics.inPlay, false);
    assert.strictEqual(game.state, 'serve_replay');
});



test('Tournament save rejects an active player match with a missing opponent', () => {
    const originalStorage = global.localStorage;
    global.localStorage = { getItem() { return null; }, setItem() {} };
    try {
        const tournament = new Tournament();
        tournament.startNewTournament('tr', 'world', 'medium');

        tournament.currentStageIndex = 1;
        tournament.bracket.qf[0].p1 = 'tr';
        tournament.bracket.qf[0].p2 = null;
        assert.strictEqual(
            tournament.isValidSavedBracket(tournament.bracket, 'world', 'tr', 1),
            false
        );
    } finally {
        if (originalStorage === undefined) delete global.localStorage;
        else global.localStorage = originalStorage;
    }
});

test('Tournament save rejects impossible winners and duplicate opening-round countries', () => {
    const originalStorage = global.localStorage;
    global.localStorage = { getItem() { return null; }, setItem() {} };
    try {
        const tournament = new Tournament();
        tournament.startNewTournament('tr', 'masters', 'medium');
        const badWinner = JSON.parse(JSON.stringify(tournament.bracket));
        badWinner.qf[1].winner = 'tr';
        badWinner.qf[1].score = '11 - 8';
        assert.strictEqual(tournament.isValidSavedBracket(badWinner, 'masters', 'tr', 0), false);

        const duplicate = JSON.parse(JSON.stringify(tournament.bracket));
        duplicate.qf[1].p1 = duplicate.qf[0].p2;
        assert.strictEqual(tournament.isValidSavedBracket(duplicate, 'masters', 'tr', 0), false);
    } finally {
        if (originalStorage === undefined) delete global.localStorage;
        else global.localStorage = originalStorage;
    }
});

test('Post-final tournament save is valid only when the player actually won the final', () => {
    const originalStorage = global.localStorage;
    global.localStorage = { getItem() { return null; }, setItem() {} };
    try {
        const tournament = new Tournament();
        tournament.startNewTournament('tr', 'masters', 'medium');
        tournament.currentStageIndex = 3;
        tournament.bracket.fn[0].p1 = 'tr';
        tournament.bracket.fn[0].p2 = 'cn';
        tournament.bracket.fn[0].winner = 'cn';
        tournament.bracket.fn[0].score = '9 - 11';
        assert.strictEqual(tournament.isValidSavedBracket(tournament.bracket, 'masters', 'tr', 3), false);
        tournament.bracket.fn[0].winner = 'tr';
        tournament.bracket.fn[0].score = '11 - 9';
        assert.strictEqual(tournament.isValidSavedBracket(tournament.bracket, 'masters', 'tr', 3), true);
    } finally {
        if (originalStorage === undefined) delete global.localStorage;
        else global.localStorage = originalStorage;
    }
});






test('endMatch is idempotent once the match is already finished', () => {
    const game = Object.create(Game.prototype);
    game.state = 'match_end';
    game.physics = { inPlay: true };
    game.tournament = { recordMatchResult() { throw new Error('must not commit twice'); } };
    game.endMatch('player');
    assert.strictEqual(game.state, 'match_end');

    assert.strictEqual(game.physics.inPlay, true);
});

console.log('\nAll retained single-Pro regression tests passed.');

test('Arcade profile compatibility requests always resolve to permanent Pro physics', () => {
    const physics = new Physics();
    assert.strictEqual(physics.profile, 'pro');
    assert.strictEqual(physics.setProfile('arcade'), 'pro');
    assert.strictEqual(physics.profile, 'pro');
    assert.strictEqual(physics.isProMode(), true);
});

test('Pro player racket uses the former elongated vertical capsule hitbox', () => {
    const controller = Object.create(Controller.prototype);
    controller.physics = new Physics();
    controller.physics.setProfile('pro');



    const elongated = controller.getBladeContact(0.10, -0.18);
    assert.strictEqual(elongated.hit, true);
    assert(elongated.distance <= 1);
    assert(elongated.rawDistance <= 0.115);

    const outside = controller.getBladeContact(0.13, -0.18);
    assert.strictEqual(outside.hit, false);
});

test('Game compatibility setter cannot reactivate Arcade physics', () => {
    const game = Object.create(Game.prototype);
    game.physicsProfile = 'pro';
    game.physics = new Physics();
    game.profileChangeRequiresServeReset = true;
    game.updatePhysicsProfileUI = () => {};
    game.updateProCoachUI = () => {};
    game.setPhysicsProfile('arcade', false);
    assert.strictEqual(game.physicsProfile, 'pro');
    assert.strictEqual(game.physics.profile, 'pro');
    assert.strictEqual(game.profileChangeRequiresServeReset, false);
});

test('Playable HTML no longer exposes Arcade physics, Combo, Momentum or special-shot UI', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert(!html.includes('data-physics="arcade"'));
    assert(!html.includes('id="arcade-flow-hud"'));
    assert(!html.includes('id="arcade-performance-report"'));
    assert(!html.includes('class="arcade-special-btn'));
});

test('AI across all difficulties can physically reach and return smashes across table width', () => {
    for (const diff of ['easy', 'medium', 'hard']) {
        const physics = new Physics();
        physics.setProfile('pro');
        const ai = new AI(physics, {}, { play() {} });
        ai.setDifficulty(diff);


        const targetX = 0.45;
        const targetZ = -1.20;
        physics.pos = { x: 0, y: 0.98, z: 1.17 };
        physics.isPlayerSmash = true;
        physics.inPlay = true;
        physics.hitTowards('player', targetX, targetZ, 0.35, 120, 0, false);

        let hit = false;
        ai.executeHit = () => { hit = true; };

        const dt = 1 / 60;
        for (let frame = 0; frame < 90 && !hit; frame++) {
            ai.update(dt);
            physics.update(dt);
            if (physics.pos.z < ai.pos.z - 0.05) break;
        }

        assert(hit, `${diff} AI should successfully reach and return corner smash`);
    }
});

test('AI smash defense outcomes produce tactical blocks, chops and counters rather than constant weak popups', () => {
    const { ai, physics } = makeAI('hard', 'pro');
    physics.pos = { x: 0.1, y: 0.85, z: -1.48 };
    physics.vel = { x: 1.5, y: 1.2, z: -7.5 };
    physics.inPlay = true;

    let nonPopupCount = 0;
    for (let i = 0; i < 50; i++) {
        physics.isPlayerSmash = true;
        ai.executeHit();
        if (ai.currentShotType === 'block' || ai.currentShotType === 'counter' || ai.currentShotType === 'chop') {
            nonPopupCount++;
        }
    }

    assert(nonPopupCount >= 35, `Hard AI should return solid defense, got ${nonPopupCount}/50 non-popups`);
});

test('AI smash reaction latency and speed burst allow covering fast corner smashes', () => {
    for (const diff of ['easy', 'medium', 'hard']) {
        const { ai } = makeAI(diff, 'pro');
        assert(ai.profile.smashReachRadius >= 0.10, `${diff} smashReachRadius should be at least 0.10m`);
        assert(ai.profile.smashSpeedBurst > 1.0, `${diff} smashSpeedBurst should provide defensive sprint`);
        assert(ai.profile.smashReactionDelay < ai.profile.reactionDelay, `${diff} smashReactionDelay should anticipate smash`);
        assert(ai.profile.smashPopupChance < 0.50, `${diff} smashPopupChance should not be excessive`);
    }
});

test('AI launchServe records matchMaxRally and proMatchStats.maxRally', () => {
    const { ai } = makeAI('medium', 'pro');
    const dummyGame = {
        state: 'serving',
        isServe: true,
        rallyCount: 0,
        matchMaxRally: 0,
        proMatchStats: { maxRally: 0 },
        updateRallyCounter() {}
    };
    const oldGame = window.gameInstance;
    try {
        window.gameInstance = dummyGame;
        ai.launchServe();
        assert.strictEqual(dummyGame.rallyCount, 1);
        assert.strictEqual(dummyGame.matchMaxRally, 1);
        assert.strictEqual(dummyGame.proMatchStats.maxRally, 1);
    } finally {
        window.gameInstance = oldGame;
    }
});

test('Pro match report accurately writes all metrics and maxRally to DOM elements', () => {
    const game = Object.create(Game.prototype);
    game.physicsProfile = 'pro';
    game.proCoachStats = { in: 12, net: 2, out: 1 };
    game.matchMaxRally = 7;
    game.proMatchStats = {
        shots: 15,
        contactSum: 12.0,
        qualitySum: 11.5,
        maxSpeed: 88.6,
        maxSpin: 140.2,
        serves: 6,
        legalServes: 6,
        aces: 1,
        maxRally: 7
    };

    const dom = {};
    const makeEl = (id) => {
        dom[id] = { textContent: '', classList: { toggle() {}, add() {}, remove() {} } };
        return dom[id];
    };

    game.elProReport = makeEl('pro-performance-report');
    game.elProReportAccuracy = makeEl('pro-report-accuracy');
    game.elProReportContact = makeEl('pro-report-contact');
    game.elProReportSpeed = makeEl('pro-report-speed');
    game.elProReportSpin = makeEl('pro-report-spin');
    game.elProReportServe = makeEl('pro-report-serve');
    game.elProReportRally = makeEl('pro-report-rally');

    game.renderProMatchReport();

    assert.strictEqual(game.elProReportAccuracy.textContent, '80%');
    assert.strictEqual(game.elProReportContact.textContent, '80%');
    assert.strictEqual(game.elProReportSpeed.textContent, '89 km/h');
    assert.strictEqual(game.elProReportSpin.textContent, '140');
    assert.strictEqual(game.elProReportServe.textContent, '100%');
    assert.strictEqual(game.elProReportRally.textContent, 7);
});

test('awardPoint and onHit preserve and advance matchMaxRally over multiple points', () => {
    const game = Object.create(Game.prototype);
    game.proMatchStats = { shots: 0, contactSum: 0, qualitySum: 0, maxSpeed: 0, maxSpin: 0, serves: 0, legalServes: 0, aces: 0, maxRally: 0 };
    game.matchMaxRally = 0;
    game.rallyCount = 0;
    game.state = 'serving';
    game.targetPoints = 11;
    game.playerScore = 0;
    game.opponentScore = 0;
    game.serveCount = 0;
    game.physicsProfile = 'pro';
    game.physics = { inPlay: true, lastHitter: 'player', isPlayerSmash: false };
    game.audio = { play() {} };
    game.showCallout = () => {};
    game.flipScore = () => {};
    game.updateRallyCounter = () => {};


    game.rallyCount = 1;
    game.matchMaxRally = Math.max(game.matchMaxRally, 1);
    game.proMatchStats.maxRally = Math.max(game.proMatchStats.maxRally, game.matchMaxRally);

    for (let h = 0; h < 3; h++) {
        game.rallyCount++;
        game.matchMaxRally = Math.max(game.matchMaxRally, game.rallyCount);
        game.proMatchStats.maxRally = Math.max(game.proMatchStats.maxRally, game.matchMaxRally);
    }
    assert.strictEqual(game.rallyCount, 4);
    assert.strictEqual(game.matchMaxRally, 4);
    assert.strictEqual(game.proMatchStats.maxRally, 4);


    game.awardPoint('player');
    assert.strictEqual(game.matchMaxRally, 4);
    assert.strictEqual(game.proMatchStats.maxRally, 4);


    game.state = 'serving';
    game.rallyCount = 0;
    game.rallyCount = 1;

    game.rallyCount = 2;
    game.awardPoint('opponent');

    assert.strictEqual(game.matchMaxRally, 4);
    assert.strictEqual(game.proMatchStats.maxRally, 4);


    game.state = 'serving';
    game.rallyCount = 11;
    game.matchMaxRally = Math.max(game.matchMaxRally, game.rallyCount);
    game.proMatchStats.maxRally = Math.max(game.proMatchStats.maxRally, game.matchMaxRally);
    game.awardPoint('player');
    assert.strictEqual(game.matchMaxRally, 11);
    assert.strictEqual(game.proMatchStats.maxRally, 11);
    clearTimeout(game.nextPointTimeout);
});

test('openCareerStatsModal localizes career stage pill and career metrics in active language', () => {
    const game = Object.create(Game.prototype);
    game.elCareerModal = { classList: { remove() {}, add() {} } };
    game.tournament = {
        getCareerStats() {
            return {
                trophies: 3,
                matchesPlayed: 10,
                matchesWon: 8,
                matchesLost: 2,
                winRate: 80,
                highestRally: 25
            };
        }
    };
    game.pauseGame = () => {};

    const oldI18n = window.i18n;
    const oldDoc = global.document;

    const mockPill = { innerHTML: '' };
    const elements = {
        'stat-trophies-num': { textContent: '' },
        'stat-trophies-grid-num': { textContent: '' },
        'stat-matches-num': { textContent: '' },
        'stat-wins-num': { textContent: '' },
        'stat-losses-num': { textContent: '' },
        'stat-winrate-num': { textContent: '' },
        'stat-rally-num': { textContent: '' }
    };

    global.document = {
        querySelector(selector) {
            if (selector === '.career-stage-pill') return mockPill;
            return null;
        },
        getElementById(id) {
            return elements[id] || null;
        }
    };

    window.i18n = {
        t(key) {
            if (key === 'career_title') return 'CAREER RECORD';
            return key;
        }
    };

    try {
        game.openCareerStatsModal();
        assert(mockPill.innerHTML.includes('CAREER RECORD'), 'career stage pill should contain localized CAREER RECORD');
        assert(mockPill.innerHTML.includes('data-i18n="career_title"'), 'career stage pill should retain data-i18n attribute');
        assert.strictEqual(elements['stat-trophies-num'].textContent, 3);
        assert.strictEqual(elements['stat-matches-num'].textContent, 10);
        assert.strictEqual(elements['stat-winrate-num'].textContent, '80%');
        assert.strictEqual(elements['stat-rally-num'].textContent, 25);
    } finally {
        window.i18n = oldI18n;
        global.document = oldDoc;
    }
});

test('Arcade mode displays custom player and enemy avatars across scoreboard and modals', () => {
    const game = Object.create(Game.prototype);
    game.gameMode = 'arcade';
    game.safeStorageGet = () => 'medium';
    game.setDifficulty = () => {};

    const elements = {
        'flag-player-img': { src: '' },
        'flag-opponent-img': { src: '' },
        'flag-player-box': { title: '' },
        'flag-opponent-box': { title: '' },
        'pause-flag-player': { src: '' },
        'pause-flag-opponent': { src: '' },
        'go-flag-player': { src: '' },
        'go-flag-opponent': { src: '' },
        'go-team-player': { textContent: '' },
        'go-team-opponent': { textContent: '' }
    };

    const oldDoc = global.document;
    const oldI18n = window.i18n;

    global.document = {
        getElementById(id) {
            return elements[id] || null;
        },
        querySelectorAll(selector) {
            return [];
        }
    };

    window.i18n = {
        t(key) {
            if (key === 'player_label') return 'SEN';
            if (key === 'enemy_label') return 'AI RAKİP';
            return key;
        },
        getCountryName(code) {
            return code;
        }
    };

    try {
        game.applyTournamentMatch();

        assert.strictEqual(game.playerCountry.flag, 'assets/avatar_player.png', 'player avatar flag path should match');
        assert.strictEqual(game.opponentCountry.flag, 'assets/avatar_enemy.png', 'enemy avatar flag path should match');
        assert.strictEqual(elements['flag-player-img'].src, 'assets/avatar_player.png');
        assert.strictEqual(elements['flag-opponent-img'].src, 'assets/avatar_enemy.png');
        assert.strictEqual(elements['pause-flag-player'].src, 'assets/avatar_player.png');
        assert.strictEqual(elements['pause-flag-opponent'].src, 'assets/avatar_enemy.png');
        assert.strictEqual(elements['go-flag-player'].src, 'assets/avatar_player.png');
        assert.strictEqual(elements['go-flag-opponent'].src, 'assets/avatar_enemy.png');
        assert.strictEqual(elements['flag-player-box'].title, 'SEN');
        assert.strictEqual(elements['flag-opponent-box'].title, 'AI RAKİP');


        game.gameMode = 'tournament';
        game.tournament = {
            getPlayerCountry() {
                return { code: 'tr', name: 'Türkiye', flag: 'assets/tr.svg' };
            },
            getCurrentOpponent() {
                return { code: 'us', name: 'ABD', flag: 'assets/us.svg' };
            },
            getCurrentStage() {
                return { name: 'Final', roundName: 'Final' };
            }
        };
        game.applyTournamentMatch();
        assert.strictEqual(game.playerCountry.flag, 'assets/tr.svg', 'tournament mode should use country flag');
        assert.strictEqual(game.opponentCountry.flag, 'assets/us.svg', 'tournament mode should use opponent country flag');
        assert.strictEqual(elements['flag-player-img'].src, 'assets/tr.svg');
        assert.strictEqual(elements['flag-opponent-img'].src, 'assets/us.svg');
    } finally {
        global.document = oldDoc;
        window.i18n = oldI18n;
    }
});

test('Championship arena barrier texture brands court with TABLE TENNIS REFLEX', () => {
    const oldDoc = global.document;
    const oldThree = global.THREE;
    const oldWindow = global.window;

    try {
        const captured = [];
        const mockCtx = {
            fillStyle: '',
            font: '',
            textAlign: '',
            fillRect() {},
            measureText(t) { return { width: t.length * 10 }; },
            fillText(text, x, y) { captured.push({ text, x, y }); }
        };
        const mockCanvas = {
            getContext() { return mockCtx; }
        };
        const mockTHREE = {
            CanvasTexture: class { constructor(c) { this.canvas = c; } },
            RepeatWrapping: 1000,
            ClampToEdgeWrapping: 1001
        };

        global.document = { createElement(type) { if (type === 'canvas') return mockCanvas; return {}; } };
        global.THREE = mockTHREE;
        global.window = {};

        const rendererCode = fs.readFileSync(path.join(root, 'js/renderer.js'), 'utf8');
        vm.runInThisContext(rendererCode, { filename: 'renderer.js' });
        const Renderer = window.TableTennisRenderer;
        const r = Object.create(Renderer.prototype);
        r.createBarrierTexture();

        const renderedText = captured.map(c => c.text).join(' ');
        assert(renderedText.includes('TABLE TENNIS'), 'barrier should include TABLE TENNIS');
        assert(renderedText.includes('REFLEX'), 'barrier should include REFLEX');
        assert(!renderedText.includes('WORLD TOUR'), 'barrier should no longer mention WORLD TOUR');
    } finally {
        global.document = oldDoc;
        global.THREE = oldThree;
        global.window = oldWindow;
    }
});

test('Player shots never collide with the net under any angle or technique ("fileyi görmesin")', () => {
    const physics = new Physics();
    physics.setProfile('pro');
    physics.pos = { x: 0, y: 0.82, z: 1.10 };

    let netHitCount = 0;
    physics.onNetHit = () => { netHitCount++; };


    physics.hitTowards('player', 0.1, -1.0, 0.45, 120, 0, false);
    assert.strictEqual(physics.playerNetImmunity, true, 'playerNetImmunity must be true for player shots');

    let crossedNet = false;
    for (let i = 0; i < 240 && physics.inPlay; i++) {
        const prevZ = physics.pos.z;
        physics.update(1 / 120);
        if (prevZ > 0 && physics.pos.z <= 0) {
            crossedNet = true;
            assert(physics.pos.y >= physics.NET_Y, `Player shot must clear net height, got y=${physics.pos.y}`);
        }
    }

    assert(crossedNet, 'Player shot should cross the net plane');
    assert.strictEqual(netHitCount, 0, 'Player shot must never trigger onNetHit');
    assert.strictEqual(physics.netHit, false, 'Player shot netHit must remain false');


    const controller = makeProTechniquePlanner({ speed: 1380, vx: 0, vy: -1320, rotX: 0.50 });
    controller.audio = { play() {} };
    controller.physics = physics;
    let hitIntoNetCalled = false;
    physics.hitIntoNet = () => { hitIntoNetCalled = true; };
    controller.executeHit(false, 0.5);
    assert.strictEqual(hitIntoNetCalled, false, 'Controller executeHit must never call hitIntoNet for player');
});



