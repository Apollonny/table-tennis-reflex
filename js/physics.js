






class TableTennisPhysics {
    constructor() {

        this.TABLE_LENGTH = 2.74;
        this.TABLE_WIDTH = 1.525;
        this.TABLE_HEIGHT = 0.76;
        this.TABLE_HALF_L = this.TABLE_LENGTH / 2;
        this.TABLE_HALF_W = this.TABLE_WIDTH / 2;
        this.TABLE_SURFACE_Y = 0.76;

        this.NET_HEIGHT = 0.1525;
        this.NET_Y = this.TABLE_HEIGHT + this.NET_HEIGHT;
        this.NET_HALF_W = this.TABLE_HALF_W + 0.15;


        this.RADIUS = 0.020;
        this.GRAVITY = -9.81;
        this.BOUNCE_RESTITUTION = 0.84;


        this.profile = 'pro';


        this.pos = { x: 0.10, y: 0.95, z: 1.25 };
        this.vel = { x: 0, y: 0, z: 0 };
        this.spin = { x: 0, y: 0, z: 0 };


        this.isPlayerSmash = false;
        this.isPlayerHard = false;
        this.isPlayerSuperSmash = false;
        this.playerShotSpeedKmh = 0;
        this.playerShotSpinX = 0;
        this.playerShotSpinY = 0;
        this.playerStrokeType = 'drive';


        this.lastHitter = null;
        this.bouncesSinceHit = 0;
        this.bounceHistory = [];
        this.netHit = false;
        this.netHitExpected = false;
        this.playerNetImmunity = false;
        this.inPlay = false;


        this.onBounce = null;
        this.onNetHit = null;
    }

    setProfile(_profile = 'pro') {


        this.profile = 'pro';
        return this.profile;
    }

    isProMode() {
        return this.profile === 'pro';
    }

    reset(serveBy = 'player') {
        this.inPlay = false;
        this.isServeActive = false;
        this.netHit = false;
        this.netHitExpected = false;
        this.playerNetImmunity = false;
        this.bouncesSinceHit = 0;
        this.bounceHistory = [];
        this.hasBouncedOnPlayerTable = false;
        this.hasBouncedOnOpponentTable = false;
        this.lastHitter = serveBy;
        this.isPlayerSmash = false;
        this.isPlayerHard = false;
        this.isPlayerSuperSmash = false;
        this.playerShotSpeedKmh = 0;
        this.playerShotSpinX = 0;
        this.playerShotSpinY = 0;
        this.playerStrokeType = 'drive';

        if (serveBy === 'player') {

            this.pos = { x: 0.15, y: this.TABLE_HEIGHT + 0.16, z: 0.85 };
            this.vel = { x: 0, y: 0, z: 0 };
        } else {
            this.pos = { x: -0.15, y: this.TABLE_HEIGHT + 0.16, z: -1.25 };
            this.vel = { x: 0, y: 0, z: 0 };
        }
        this.spin = { x: 0, y: 0, z: 0 };
    }







    serveBall(serverSide, targetX = 0, targetZ = undefined, sidespin = 0, spinX = 20) {
        this.lastHitter = serverSide;
        this.bouncesSinceHit = 0;
        this.bounceHistory = [];
        this.hasBouncedOnPlayerTable = false;
        this.hasBouncedOnOpponentTable = false;
        this.netHit = false;
        this.netHitExpected = false;
        this.playerNetImmunity = (serverSide === 'player');
        this.inPlay = true;
        this.isServeActive = true;
        this.isPlayerSmash = false;
        this.isPlayerHard = false;
        this.isPlayerSuperSmash = false;
        this.playerShotSpeedKmh = 0;

        if (serverSide === 'player') {

            this.pos.x = Math.max(-0.35, Math.min(0.35, this.pos.x || 0.10));
            this.pos.y = this.TABLE_SURFACE_Y + 0.16;
            this.pos.z = 0.85;

            const t1 = 0.10;
            const targetOwnZ = 0.50;
            const targetOwnX = this.pos.x * 0.7 + targetX * 0.15;

            this.vel.x = (targetOwnX - this.pos.x) / t1;
            this.vel.y = -1.25;
            this.vel.z = (targetOwnZ - this.pos.z) / t1;

            this.serveTargetOpponentX = Math.max(-0.62, Math.min(0.62, targetX));
            this.serveTargetOpponentZ = targetZ !== undefined
                ? Math.max(-1.24, Math.min(-0.48, targetZ))
                : -0.92;
        } else {
            this.pos.x = -0.15;
            this.pos.y = this.TABLE_SURFACE_Y + 0.16;
            this.pos.z = -1.25;

            const t1 = 0.10;
            const targetOwnZ = -0.75;
            const targetOwnX = this.pos.x * 0.7 + targetX * 0.15;

            this.vel.x = (targetOwnX - this.pos.x) / t1;
            this.vel.y = -1.25;
            this.vel.z = (targetOwnZ - this.pos.z) / t1;

            this.serveTargetOpponentX = Math.max(-0.62, Math.min(0.62, targetX));

            this.serveTargetOpponentZ = targetZ !== undefined ? targetZ : 1.15;
        }

        this.spin = { x: Number.isFinite(spinX) ? spinX : 20, y: sidespin || 0, z: 0 };
    }






    getFlightAcceleration(velocity, spin) {
        const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
        const drag = 0.015 * speed;
        const magnusX = Math.max(-0.45, Math.min(0.45, -spin.y * velocity.z * 0.00035));
        const forwardSpeed = Math.abs(velocity.z);
        const magnusY = Math.max(-1.8, Math.min(0.9, -spin.x * forwardSpeed * 0.0006));

        return {
            x: -drag * velocity.x + magnusX,
            y: this.GRAVITY - drag * velocity.y + magnusY,
            z: -drag * velocity.z
        };
    }






    predictTrajectory(initialVelocity, spin, duration, startPos = this.pos, step = 1 / 240) {
        const pos = { x: startPos.x, y: startPos.y, z: startPos.z };
        const vel = { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z };
        const spinState = { x: spin.x || 0, y: spin.y || 0, z: spin.z || 0 };
        const total = Math.max(0.001, duration);
        const maxStep = Math.max(1 / 720, Math.min(1 / 120, step));
        let elapsed = 0;
        let netCrossing = null;

        while (elapsed < total - 1e-9) {
            const dt = Math.min(maxStep, total - elapsed);
            const prev = { x: pos.x, y: pos.y, z: pos.z };
            const a = this.getFlightAcceleration(vel, spinState);

            vel.x += a.x * dt;
            vel.y += a.y * dt;
            vel.z += a.z * dt;

            spinState.x *= (1 - 0.15 * dt);
            spinState.y *= (1 - 0.15 * dt);

            pos.x += vel.x * dt;
            pos.y += vel.y * dt;
            pos.z += vel.z * dt;

            if (!netCrossing && ((prev.z > 0 && pos.z <= 0) || (prev.z < 0 && pos.z >= 0))) {
                const denom = prev.z - pos.z;
                const t = Math.abs(denom) > 1e-9 ? Math.max(0, Math.min(1, prev.z / denom)) : 0.5;
                netCrossing = {
                    x: prev.x + (pos.x - prev.x) * t,
                    y: prev.y + (pos.y - prev.y) * t,
                    time: elapsed + dt * t
                };
            }


            if (pos.y > 1.35) {
                pos.y = 1.35;
                if (vel.y > 0) vel.y = 0;
            }

            elapsed += dt;
        }

        return { pos, vel, spin: spinState, netCrossing };
    }






    solveProTrajectoryVelocity(targetX, targetZ, duration, spinX, spinY, initialVelocity) {
        const T = Math.max(0.20, duration);
        const target = { x: targetX, y: this.TABLE_SURFACE_Y + this.RADIUS, z: targetZ };
        const velocity = { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z };
        const spin = { x: spinX, y: spinY, z: 0 };



        for (let i = 0; i < 5; i++) {
            const predicted = this.predictTrajectory(velocity, spin, T, this.pos, 1 / 300);
            const ex = target.x - predicted.pos.x;
            const ey = target.y - predicted.pos.y;
            const ez = target.z - predicted.pos.z;

            if (Math.max(Math.abs(ex), Math.abs(ey), Math.abs(ez)) < 0.00075) break;

            const gain = 1.04 / T;
            velocity.x += ex * gain;
            velocity.y += ey * gain;
            velocity.z += ez * gain;
            velocity.y = Math.max(0.05, Math.min(4.2, velocity.y));
        }

        return velocity;
    }






    hitTowards(side, targetX, targetZ, duration, spinX = 0, spinY = 0, allowOut = false) {
        this.lastHitter = side;
        this.bouncesSinceHit = 0;
        this.bounceHistory = [];
        this.hasBouncedOnPlayerTable = false;
        this.hasBouncedOnOpponentTable = false;
        this.netHit = false;
        this.netHitExpected = false;
        this.playerNetImmunity = (side === 'player');
        this.inPlay = true;

        if (side === 'opponent') {
            this.isPlayerSmash = false;
            this.isPlayerHard = false;
            this.isPlayerSuperSmash = false;
            this.playerShotSpeedKmh = 0;
            this.playerShotSpinX = 0;
            this.playerShotSpinY = 0;
            this.playerStrokeType = 'drive';
        }

        const x0 = this.pos.x;
        this.pos.y = Math.max(this.TABLE_SURFACE_Y + 0.08, this.pos.y);
        const y0 = this.pos.y;
        const z0 = this.pos.z;


        let safeZ = targetZ;
        const clampDepth = side === 'player'
            ? (!this.isProMode() && !allowOut)
            : (!this.isProMode() || !allowOut);

        if (clampDepth) {
            if (side === 'player') {

                safeZ = Math.min(-0.55, Math.max(-1.22, targetZ));
            } else {

                const minSafeZ = this.isProMode() ? 0.28 : 0.65;
                const maxSafeZ = this.isProMode() ? 1.16 : 1.02;
                safeZ = Math.min(maxSafeZ, Math.max(minSafeZ, targetZ || 0.88));
            }
        }


        let safeX = targetX;
        if (side === 'opponent' && (!this.isProMode() || !allowOut)) {
            const maxSafeX = this.isProMode() ? 0.56 : 0.42;
            safeX = Math.max(-maxSafeX, Math.min(maxSafeX, targetX));
        }

        const xt = safeX;
        const yt = this.TABLE_SURFACE_Y + this.RADIUS;
        const zt = safeZ;

        let T = Math.max(0.30, Math.min(0.85, duration));
        const g = this.GRAVITY;

        let vz = (zt - z0) / T;
        let vx = (xt - x0) / T;


        let vy = (yt - y0 - 0.5 * g * T * T) / T;



        if ((!this.isProMode() || side === 'player') && Math.abs(vz) > 0.5) {
            const t_net = -z0 / vz;
            if (t_net > 0 && t_net < T) {
                const minNetY = 1.00;
                const y_at_net = y0 + vy * t_net + 0.5 * g * t_net * t_net;
                if (y_at_net < minNetY) {
                    vy = (minNetY - y0 - 0.5 * g * t_net * t_net) / t_net;
                    const a = 0.5 * g;
                    const b = vy;
                    const c = y0 - yt;
                    const disc = b * b - 4 * a * c;
                    if (disc >= 0) {
                        const root1 = (-b - Math.sqrt(disc)) / (2 * a);
                        const root2 = (-b + Math.sqrt(disc)) / (2 * a);
                        T = Math.max(root1, root2);
                        vz = (zt - z0) / T;
                        vx = (xt - x0) / T;
                    }
                }
            }
        }


        const requiredMinVy = (side === 'player') ? 0.45 : (this.isProMode() ? 0.15 : ((side === 'opponent') ? 0.9 : 0.7));
        vy = Math.max(requiredMinVy, Math.min(4.2, vy));



        if (this.isProMode()) {
            const solved = this.solveProTrajectoryVelocity(xt, zt, T, spinX, spinY, { x: vx, y: vy, z: vz });
            vx = solved.x;
            vy = solved.y;
            vz = solved.z;
        }

        this.vel.x = vx;
        this.vel.y = vy;
        this.vel.z = vz;

        this.spin.x = spinX;
        this.spin.y = spinY;
        this.spin.z = 0;

        if (this.onHit) this.onHit(side);
    }

    hitIntoNet(side) {

        if (!this.isProMode()) {
            const targetX = (Math.random() < 0.5 ? -1 : 1) * 0.88;
            const targetZ = side === 'opponent' ? 1.52 : -1.52;
            this.hitTowards(side, targetX, targetZ, 0.42, 10, 0, true);
            return;
        }

        this.lastHitter = side;
        this.bouncesSinceHit = 0;
        this.bounceHistory = [];
        this.hasBouncedOnPlayerTable = false;
        this.hasBouncedOnOpponentTable = false;
        this.netHit = false;
        this.netHitExpected = true;
        this.playerNetImmunity = false;
        this.inPlay = true;
        this.isServeActive = false;

        if (side === 'opponent') {
            this.isPlayerSmash = false;
            this.isPlayerHard = false;
            this.isPlayerSuperSmash = false;
            this.playerShotSpeedKmh = 0;
            this.playerShotSpinX = 0;
            this.playerShotSpinY = 0;
            this.playerStrokeType = 'drive';
        }

        const z0 = this.pos.z;
        const y0 = Math.max(this.TABLE_SURFACE_Y + 0.06, this.pos.y);
        this.pos.y = y0;

        const targetZ = side === 'opponent' ? 0.86 : -0.86;
        const totalTime = 0.40;
        const vz = (targetZ - z0) / totalTime;
        const tNet = Math.max(0.08, Math.min(0.32, -z0 / vz));
        const desiredNetY = this.NET_Y - this.RADIUS * 0.65;
        const vy = (desiredNetY - y0 - 0.5 * this.GRAVITY * tNet * tNet) / tNet;

        this.vel.x = ((Math.random() - 0.5) * 0.16 - this.pos.x) / totalTime;
        this.vel.y = vy;
        this.vel.z = vz;
        this.spin = { x: 6, y: 0, z: 0 };

        if (this.onHit) this.onHit(side);
    }

    hitBall(side, velocity, spin) {
        this.lastHitter = side;
        this.bouncesSinceHit = 0;
        this.bounceHistory = [];
        this.hasBouncedOnPlayerTable = false;
        this.hasBouncedOnOpponentTable = false;
        this.netHit = false;
        this.netHitExpected = false;
        this.playerNetImmunity = (side === 'player');
        this.inPlay = true;

        this.vel.x = velocity.x;
        this.vel.y = velocity.y;
        this.vel.z = velocity.z;

        if (spin) {
            this.spin.x = spin.x || 0;
            this.spin.y = spin.y || 0;
            this.spin.z = spin.z || 0;
        } else {
            this.spin = { x: 0, y: 0, z: 0 };
        }

        if (this.onHit) this.onHit(side);
    }

    update(dt) {
        if (!this.inPlay) {

            if (!window.gameInstance || window.gameInstance.state !== 'paused') {
                this.pos.y = (this.TABLE_HEIGHT + 0.19) + Math.sin(performance.now() * 0.005) * 0.012;
            }
            return;
        }




        const frameDt = Math.min(0.04, dt);
        const maxSubDt = 1 / 240;
        const substeps = Math.max(1, Math.ceil(frameDt / maxSubDt));
        const subDt = frameDt / substeps;

        for (let i = 0; i < substeps; i++) {
            if (!this.inPlay) break;
            this.stepPhysics(subDt);
        }
    }

    stepPhysics(dt) {



        const a = this.getFlightAcceleration(this.vel, this.spin);

        this.vel.x += a.x * dt;
        this.vel.y += a.y * dt;
        this.vel.z += a.z * dt;

        this.spin.x *= (1 - 0.15 * dt);
        this.spin.y *= (1 - 0.15 * dt);

        const prevX = this.pos.x;
        const prevY = this.pos.y;
        const prevZ = this.pos.z;

        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;
        this.pos.z += this.vel.z * dt;



        if ((prevZ > 0 && this.pos.z <= 0) || (prevZ < 0 && this.pos.z >= 0)) {
            const isPlayerImmune = Boolean(this.playerNetImmunity);

            if (isPlayerImmune) {


                if (this.pos.y < this.NET_Y + 0.028) {
                    this.pos.y = this.NET_Y + 0.028;
                    if (this.vel.y < 0.35) this.vel.y = 0.35;
                }
            } else if (this.isProMode()) {
                const denom = prevZ - this.pos.z;
                const t = Math.abs(denom) > 0.000001 ? Math.max(0, Math.min(1, prevZ / denom)) : 0.5;
                const yAtNet = prevY + (this.pos.y - prevY) * t;
                const xAtNet = prevX + (this.pos.x - prevX) * t;
                const touchesNet = Math.abs(xAtNet) <= this.NET_HALF_W && (yAtNet - this.RADIUS) <= this.NET_Y;

                if (touchesNet && !this.netHit) {
                    this.netHit = true;
                    const isTapeTouch = yAtNet >= this.NET_Y - this.RADIUS * 0.75;

                    this.pos.x = xAtNet;
                    this.pos.y = Math.max(this.RADIUS, yAtNet);

                    if (isTapeTouch) {




                        this.pos.z = prevZ > 0 ? -0.003 : 0.003;
                        this.vel.x *= 0.72;
                        this.vel.y = Math.max(0.20, this.vel.y * 0.28 + 0.32);
                        this.vel.z *= 0.58;
                        if (this.onNetHit) this.onNetHit(true);
                        return;
                    }


                    this.pos.z = prevZ > 0 ? 0.002 : -0.002;
                    this.vel.x *= 0.35;
                    this.vel.y *= 0.25;
                    this.vel.z *= -0.18;
                    this.inPlay = false;

                    if (this.onNetHit) this.onNetHit(false);
                    return;
                }
            } else if (this.pos.y < this.NET_Y + 0.025) {
                this.pos.y = this.NET_Y + 0.025;
                if (this.vel.y < 0.35) this.vel.y = 0.35;
            }
        }


        if (this.pos.y > 1.35) {
            this.pos.y = 1.35;
            if (this.vel.y > 0) this.vel.y = 0;
        }



        this.checkTableCollision(prevX, prevY, prevZ);


        if (this.pos.y < this.RADIUS) {
            this.pos.y = this.RADIUS;
            this.vel.y = 0;
            this.vel.x *= 0.6;
            this.vel.z *= 0.6;
        }
    }

    checkTableCollision(prevX, prevY, prevZ) {
        const tableY = this.TABLE_HEIGHT + this.RADIUS;
        const nextY = this.pos.y;

        if (prevY >= tableY && nextY <= tableY) {
            const denom = prevY - nextY;
            const t = Math.abs(denom) > 1e-9 ? Math.max(0, Math.min(1, (prevY - tableY) / denom)) : 1;
            const hitX = prevX + (this.pos.x - prevX) * t;
            const hitZ = prevZ + (this.pos.z - prevZ) * t;
            const isOverTableX = Math.abs(hitX) <= this.TABLE_HALF_W;
            const isOverTableZ = Math.abs(hitZ) <= this.TABLE_HALF_L;

            if (isOverTableX && isOverTableZ) {
                this.pos.x = hitX;
                this.pos.y = tableY;
                this.pos.z = hitZ;

                const side = this.pos.z > 0 ? 'player' : 'opponent';



                if (!this.isServeActive && !this.isProMode() && side === this.lastHitter && this.bouncesSinceHit === 0) {


                    this.pos.y = tableY + 0.03;
                    if (this.vel.y < 0.8) this.vel.y = 0.8;
                    return;
                }

                this.bouncesSinceHit++;
                this.bounceHistory.push({ side, x: this.pos.x, z: this.pos.z });

                if (side === 'player') {
                    this.hasBouncedOnPlayerTable = true;
                } else {
                    this.hasBouncedOnOpponentTable = true;
                }


                if (this.isServeActive && this.bouncesSinceHit === 1) {
                    this.isServeActive = false;

                    const targetX = this.serveTargetOpponentX !== undefined ? this.serveTargetOpponentX : 0;
                    const targetZ = this.serveTargetOpponentZ !== undefined ? this.serveTargetOpponentZ : (side === 'player' ? -0.92 : 1.15);
                    const T = 0.48;

                    this.vel.x = (targetX - this.pos.x) / T;
                    this.vel.y = 2.10;
                    this.vel.z = (targetZ - this.pos.z) / T;




                    const solvedServe = this.solveProTrajectoryVelocity(
                        targetX, targetZ, T, this.spin.x, this.spin.y,
                        { x: this.vel.x, y: this.vel.y, z: this.vel.z }
                    );
                    this.vel.x = solvedServe.x;
                    this.vel.y = solvedServe.y;
                    this.vel.z = solvedServe.z;

                    if (this.onBounce) {
                        this.onBounce(side, this.pos.x, this.pos.z);
                    }
                    return;
                }


                let bounceVy = Math.abs(this.vel.y) * this.BOUNCE_RESTITUTION;
                bounceVy = Math.max(1.32, Math.min(1.62, bounceVy));
                this.vel.y = bounceVy;

                this.vel.x *= 0.88;
                this.vel.z *= 0.88;



                if (this.spin.x < -8) {
                    this.vel.z *= 0.76;
                    bounceVy = Math.max(1.16, bounceVy * 0.88);
                    this.vel.y = bounceVy;
                } else if (this.spin.x > 50) {

                    this.vel.z *= 1.05;
                }


                if (Math.abs(this.spin.y) > 2) {
                    this.vel.x += Math.max(-0.40, Math.min(0.40, this.spin.y * 0.006));
                }

                if (this.onBounce) {
                    this.onBounce(side, this.pos.x, this.pos.z);
                }
            }
        }
    }




    hasBouncedOn(side) {
        if (side === 'player') return this.hasBouncedOnPlayerTable;
        if (side === 'opponent') return this.hasBouncedOnOpponentTable;
        return false;
    }
}

window.TableTennisPhysics = TableTennisPhysics;
