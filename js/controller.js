













class TableTennisController {
    constructor(canvas, physics, renderer, audio) {
        this.canvas = canvas;
        this.physics = physics;
        this.renderer = renderer;
        this.audio = audio;


        this.pos = { x: 0, y: 0.96, z: 1.20 };
        this.prevPos = { x: 0, y: 0.96, z: 1.20 };
        this.targetPos = { x: 0, y: 0.96, z: 1.20 };
        this.rot = { x: 0, y: 0, z: 0 };


        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        this.isTouchActive = false;


        this.rawMouse = { x: window.innerWidth / 2, y: window.innerHeight * 0.70 };
        this.prevMouse = { x: window.innerWidth / 2, y: window.innerHeight * 0.70, time: performance.now() };
        this.velocity = { x: 0, y: 0, speed: 0 };
        this.history = [];
        this.lastPointerTime = performance.now();

        this.hitCooldown = 0;

        this.initEvents();
    }

    triggerHaptic(pattern) {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            try {
                navigator.vibrate(pattern);
            } catch (e) {}
        }
    }

    isUIElement(e) {
        if (!e || !e.target) return false;
        return !!(e.target.closest && e.target.closest('#pause-modal, #game-over-modal, .hud-arcade-group, .hud-top-left, .hud-arcade-block, .modal-overlay, button, select, a'));
    }

    initEvents() {
        window.addEventListener('mousemove', (e) => {
            if (window.gameInstance && window.gameInstance.state === 'paused') return;
            this.isTouchActive = false;
            this.onMouseMove(e);
        });

        window.addEventListener('touchmove', (e) => {
            if (this.isUIElement(e)) return;
            if (window.gameInstance && window.gameInstance.state === 'paused') return;
            this.isTouchActive = true;
            this.onTouchMove(e);
        }, { passive: false });

        window.addEventListener('mousedown', (e) => {
            this.onPointerDown(e);
        });

        window.addEventListener('touchstart', (e) => {
            this.onTouchStart(e);
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (this.isUIElement(e)) return;
            if (window.gameInstance && window.gameInstance.state === 'paused') return;


            if (window.gameInstance && window.gameInstance.state === 'serving' && window.gameInstance.servingSide === 'player') {
                window.gameInstance.launchServe();
            }
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            this.velocity = { x: 0, y: 0, speed: 0 };
            this.history.length = 0;
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (window.gameInstance && window.gameInstance.state === 'serving' && window.gameInstance.servingSide === 'player') {
                    window.gameInstance.launchServe();
                }
            }
        });
    }

    onMouseMove(e) {

        const clampedX = Math.max(0, Math.min(window.innerWidth, e.clientX));
        const clampedY = Math.max(0, Math.min(window.innerHeight, e.clientY));
        this.updatePointer(clampedX, clampedY, false);
    }

    onTouchMove(e) {
        if (e.touches.length > 0) {
            e.preventDefault();
            const touch = e.touches[0];
            const clampedX = Math.max(0, Math.min(window.innerWidth, touch.clientX));
            const clampedY = Math.max(0, Math.min(window.innerHeight, touch.clientY));
            this.updatePointer(clampedX, clampedY, true);
        }
    }

    onPointerDown(e) {
        if (this.isUIElement(e)) return;
        if (window.gameInstance && window.gameInstance.state === 'paused') return;

        this.audio.init();
        if (window.gameInstance && window.gameInstance.state === 'serving' && window.gameInstance.servingSide === 'player') {
            window.gameInstance.launchServe();
        }
    }

    onTouchStart(e) {
        if (this.isUIElement(e)) return;
        if (window.gameInstance && window.gameInstance.state === 'paused') return;

        this.isTouchActive = true;
        this.audio.init();
        if (e.touches.length > 0) {
            e.preventDefault();
            const touch = e.touches[0];
            const clampedX = Math.max(0, Math.min(window.innerWidth, touch.clientX));
            const clampedY = Math.max(0, Math.min(window.innerHeight, touch.clientY));
            this.updatePointer(clampedX, clampedY, true);

            if (window.gameInstance && window.gameInstance.state === 'serving' && window.gameInstance.servingSide === 'player') {
                window.gameInstance.launchServe();
            }
        }
    }

    updatePointer(screenX, screenY, isTouch = false) {
        const now = performance.now();
        const dt = Math.max(0.004, Math.min(0.08, (now - this.prevMouse.time) / 1000));


        const rawVx = (screenX - this.prevMouse.x) / dt;
        const rawVy = (screenY - this.prevMouse.y) / dt;
        const vx = Math.max(-4200, Math.min(4200, rawVx));
        const vy = Math.max(-4200, Math.min(4200, rawVy));

        this.history.push({ x: screenX, y: screenY, time: now, vx, vy });
        if (this.history.length > 6) this.history.shift();

        this.velocity = this.getSmoothedVelocity(now);
        this.lastPointerTime = now;

        this.prevMouse = { x: screenX, y: screenY, time: now };
        this.rawMouse = { x: screenX, y: screenY };


        const normX = (screenX / window.innerWidth) * 2 - 1;
        this.targetPos.x = normX * 0.92;




        let effectiveY = screenY;
        if (isTouch || this.isTouchActive) {
            const touchOffsetY = Math.min(85, Math.max(45, window.innerHeight * 0.085));
            effectiveY = Math.max(0, screenY - touchOffsetY);
        }

        const minY = window.innerHeight * 0.26;
        const maxY = window.innerHeight * 0.88;
        const normY = Math.max(0, Math.min(1, (effectiveY - minY) / (maxY - minY)));
        this.targetPos.z = 0.68 + normY * 1.32;


        this.targetPos.y = 0.96;

        if (window.gameInstance && typeof window.gameInstance.updateArcadeServeAim === 'function') {
            window.gameInstance.updateArcadeServeAim();
        }


        if (window.gameInstance && window.gameInstance.state === 'serving' && window.gameInstance.servingSide === 'player') {
            const ball = this.physics.pos;
            const dist = Math.hypot(ball.x - this.pos.x, ball.y - this.pos.y, ball.z - this.pos.z);
            if (dist < 0.20 && vy < -100 && this.velocity.speed > 220) {
                window.gameInstance.launchServe();
            }
        }
    }

    resetPointTracking() {



        this.prevBallPos = null;
        this.hitCooldown = 0;
    }

    getSmoothedVelocity(now = performance.now()) {
        if (this.history.length === 0) return { x: 0, y: 0, speed: 0 };


        let sumX = 0;
        let sumY = 0;
        let sumWeight = 0;

        for (let i = 0; i < this.history.length; i++) {
            const sample = this.history[i];
            const ageMs = now - sample.time;
            if (ageMs > 95) continue;

            const recency = Math.max(0.15, 1 - ageMs / 110);
            const orderWeight = (i + 1) / this.history.length;
            const weight = recency * orderWeight;
            sumX += sample.vx * weight;
            sumY += sample.vy * weight;
            sumWeight += weight;
        }

        if (sumWeight <= 0.0001) return { x: 0, y: 0, speed: 0 };
        const smoothX = sumX / sumWeight;
        const smoothY = sumY / sumWeight;
        return {
            x: smoothX,
            y: smoothY,
            speed: Math.hypot(smoothX, smoothY)
        };
    }

    update(dt) {
        this.hitCooldown = Math.max(0, this.hitCooldown - dt);



        if (performance.now() - this.lastPointerTime > 45) {
            const decay = Math.exp(-14 * dt);
            this.velocity.x *= decay;
            this.velocity.y *= decay;
            this.velocity.speed = Math.hypot(this.velocity.x, this.velocity.y);
            if (this.velocity.speed < 8) this.velocity = { x: 0, y: 0, speed: 0 };
        }

        this.prevPos.x = this.pos.x;
        this.prevPos.y = this.pos.y;
        this.prevPos.z = this.pos.z;


        const lerpFactor = 1 - Math.exp(-38 * dt);
        this.pos.x += (this.targetPos.x - this.pos.x) * lerpFactor;
        this.pos.y += (this.targetPos.y - this.pos.y) * lerpFactor;
        this.pos.z += (this.targetPos.z - this.pos.z) * lerpFactor;
        this.pos.z = Math.max(0.68, Math.min(2.00, this.pos.z));



        let targetTiltY = 0;
        let targetTiltZ = 0;
        let targetTiltX = 0;


        if (this.pos.x >= 0) {
            targetTiltY = -0.25 - (this.pos.x * 0.28);
            targetTiltZ = -0.18 - (this.pos.x * 0.20);
        } else {
            targetTiltY = 0.28 - (this.pos.x * 0.28);
            targetTiltZ = 0.28 - (this.pos.x * 0.20);
        }


        if (Math.abs(this.velocity.x) > 50) {
            targetTiltY += (this.velocity.x / 1800) * 0.45;
        }


        const forwardTilt = Math.min(0.48, Math.max(-0.35, -this.velocity.y * 0.00035));
        targetTiltX = forwardTilt;

        this.rot.x += (targetTiltX - this.rot.x) * (1 - Math.exp(-22 * dt));
        this.rot.y += (targetTiltY - this.rot.y) * (1 - Math.exp(-22 * dt));
        this.rot.z += (targetTiltZ - this.rot.z) * (1 - Math.exp(-22 * dt));

        this.checkHit();
    }

    distToSegment(p, a, b) {
        const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
        const apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;
        const abLenSq = abx * abx + aby * aby + abz * abz;
        if (abLenSq < 0.0001) return Math.hypot(apx, apy, apz);

        let t = (apx * abx + apy * aby + apz * abz) / abLenSq;
        t = Math.max(0, Math.min(1, t));
        const cx = a.x + t * abx;
        const cy = a.y + t * aby;
        const cz = a.z + t * abz;
        return Math.hypot(p.x - cx, p.y - cy, p.z - cz);
    }

    getBladeContact(dx, dy) {



        const clampedY = Math.max(-0.20, Math.min(0.10, dy));
        const rawDistance = Math.hypot(dx, dy - clampedY);
        const capsuleRadius = 0.115;
        return {
            hit: rawDistance <= capsuleRadius,
            handle: dy < -0.10,

            distance: rawDistance / capsuleRadius,
            rawDistance
        };
    }

    getProStrokeTechnique(swipeSpeed, contactDistance = 0.5, ballY = 0.96) {
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        const clamp01 = (v) => clamp(v, 0, 1);
        const speed = Math.max(0, swipeSpeed || 0);
        const denom = Math.max(1, speed);



        const forwardRatio = clamp((-this.velocity.y) / denom, -1, 1);
        const lateralRatio = clamp(this.velocity.x / denom, -1, 1);
        const power = clamp01((speed - 220) / 1650);
        const faceAngle = clamp(this.rot.x || 0, -0.45, 0.52);
        const contactQuality = clamp01(1 - clamp01(contactDistance) * 0.70);
        const strokeSide = (!this.pos || this.pos.x >= 0) ? 'forehand' : 'backhand';




        let spinX = (120 * forwardRatio * power)
            + (180 * faceAngle * (0.35 + 0.65 * power));
        spinX *= (0.82 + contactQuality * 0.18);
        spinX = clamp(spinX, -120, 180);



        let spinY = (125 * lateralRatio * power) - ((this.rot.y || 0) * 22);
        spinY *= (0.84 + contactQuality * 0.16);
        spinY = clamp(spinY, -100, 100);




        const closedExcess = clamp01((faceAngle - 0.36) / 0.14);
        const lowBall = clamp01((0.94 - ballY) / 0.14);
        const attacking = clamp01((forwardRatio - 0.20) / 0.70);
        const edgePenalty = clamp01((1 - contactQuality) / 0.70);
        const netRisk = closedExcess
            * (0.45 + 0.55 * lowBall)
            * (0.45 + 0.55 * power)
            * (0.78 + 0.22 * edgePenalty);

        const openExcess = clamp01((-faceAngle - 0.04) / 0.24);
        const outRisk = openExcess
            * (0.38 + 0.62 * attacking)
            * (0.42 + 0.58 * power)
            * (0.74 + 0.26 * edgePenalty);

        let type = 'drive';
        if (spinX <= -35) type = 'chop';
        else if (spinX >= 82) type = 'topspin';
        else if (Math.abs(spinY) >= 42) type = 'sidespin';

        return {
            type,
            strokeSide,
            power,
            forwardRatio,
            lateralRatio,
            faceAngle,
            contactQuality,
            spinX,
            spinY,
            netRisk,
            outRisk
        };
    }

    getProRallyPlan(swipeSpeed, contactDistance = 0.5, ballY = 0.96, technique = null) {
        const tech = technique || this.getProStrokeTechnique(swipeSpeed, contactDistance, ballY);
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));



        let targetZ = -0.76
            - tech.power * 0.38
            - Math.max(0, tech.forwardRatio) * 0.12;


        if (tech.type === 'chop') targetZ += 0.10;
        if (tech.type === 'topspin') targetZ -= 0.035;

        let allowOut = false;
        if (tech.outRisk >= 0.56) {
            allowOut = true;
            targetZ = -1.45 - tech.outRisk * 0.16;
        } else {
            targetZ = clamp(targetZ, -1.31, -0.66);
        }

        let duration = 0.52 - tech.power * 0.12;
        if (tech.type === 'chop') duration += 0.07;
        if (tech.type === 'topspin') duration -= 0.015;
        duration = clamp(duration, 0.36, 0.61);

        return {
            ...tech,
            targetZ,
            duration,
            allowOut,
            forceNet: tech.netRisk >= 0.54
        };
    }

    getProSmashPlan(swipeSpeed, contactDistance = 0, technique = null) {
        const clamp01 = (v) => Math.max(0, Math.min(1, v));
        const touch = this.isTouchActive || this.isTouchDevice;
        const threshold = touch ? 850 : 1100;
        const fullPowerSpeed = touch ? 1750 : 2050;
        const tech = technique || this.getProStrokeTechnique(swipeSpeed, contactDistance, 0.98);



        const power = clamp01((swipeSpeed - threshold) / Math.max(1, fullPowerSpeed - threshold));
        const forwardRatio = clamp01(tech.forwardRatio);



        const idealFace = 0.28;
        const faceControl = clamp01(1 - Math.abs(tech.faceAngle - idealFace) / 0.55);
        const contactQuality = tech.contactQuality;
        const quality = clamp01(contactQuality * 0.45 + forwardRatio * 0.35 + faceControl * 0.20);



        const overhit = power > 0.78 && quality < 0.47;
        const powerSmash = !overhit && power > 0.42 && quality >= 0.60;

        if (overhit) {
            return {
                type: 'overhit',
                power,
                quality,
                forceNet: false,
                targetZ: -1.50 - power * 0.10,
                duration: 0.32,
                topspin: Math.max(35, Math.min(105, 42 + Math.max(0, tech.spinX) * 0.34 + quality * 18))
            };
        }

        if (powerSmash) {
            return {
                type: 'power',
                power,
                quality,
                forceNet: tech.netRisk >= 0.64,


                targetZ: -1.25 - power * 0.07 + (1 - quality) * 0.03,
                duration: 0.37 - power * 0.035,
                topspin: Math.max(105, Math.min(180, 92 + Math.max(0, tech.spinX) * 0.48 + quality * 26))
            };
        }

        return {
            type: 'controlled',
            power,
            quality,
            forceNet: tech.netRisk >= 0.64,
            targetZ: -1.15 - power * 0.07 + (1 - quality) * 0.025,
            duration: 0.40 - power * 0.025,
            topspin: Math.max(82, Math.min(165, 72 + Math.max(0, tech.spinX) * 0.45 + quality * 24))
        };
    }

    getArcadeHitPlan(swipeSpeed, contactDistance = 0.08, ballY = 0.96, isSmash = false, isHard = false, isHandleHit = false, specialMode = null) {
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        const clamp01 = (v) => clamp(v, 0, 1);
        const speed = Math.max(0, swipeSpeed || 0);
        const touch = this.isTouchActive || this.isTouchDevice;
        const smashThreshold = touch ? 850 : 1100;
        const normalizedSpecial = specialMode === true ? 'super' : (['super', 'curve', 'drop'].includes(specialMode) ? specialMode : null);



        const contactQuality = clamp01(1 - Math.max(0, contactDistance) / 0.115);
        const heightQuality = clamp01(1 - Math.abs(ballY - 0.98) / 0.28);
        const timingQuality = clamp01((speed - 260) / 900);
        const sweetSpotScore = clamp01(contactQuality * 0.62 + heightQuality * 0.20 + timingQuality * 0.18);

        const perfect = !isHandleHit && sweetSpotScore >= 0.72 && speed >= (touch ? 430 : 520);
        const perfectSmash = perfect && isSmash && speed >= smashThreshold + (touch ? 120 : 160);
        const superSmash = normalizedSpecial === 'super' && isSmash && contactQuality >= 0.54;
        const curveShot = normalizedSpecial === 'curve' && !isHandleHit && contactQuality >= 0.36;
        const dropShot = normalizedSpecial === 'drop' && !isHandleHit && contactQuality >= 0.36;

        let tier = 'rally';
        let duration = 0.50;
        let targetZ = -0.84 - Math.min(0.30, speed / 1800 * 0.30);
        let topspin = 45;
        let momentumGain = 4;
        let specialSidespin = null;
        let consumesSpecial = false;

        if (isHard) {
            tier = 'drive';
            duration = 0.44;
            targetZ = -1.08;
            topspin = 62;
            momentumGain = 7;
        }
        if (isSmash) {
            tier = 'smash';
            duration = 0.37;
            targetZ = -1.18;
            topspin = 110;
            momentumGain = 12;
        }
        if (perfect) {
            tier = isSmash ? 'perfectSmash' : 'perfect';
            duration = isSmash ? 0.335 : Math.min(duration, 0.405);
            targetZ = isSmash ? -1.22 : -1.14;
            topspin = isSmash ? 132 : 78;
            momentumGain = isSmash ? 20 : 15;
        }



        if (curveShot) {
            tier = 'curveShot';
            duration = 0.405;
            targetZ = -1.00;
            topspin = 72;
            const horizontalIntent = Math.abs(this.velocity.x || 0) > 80 ? Math.sign(this.velocity.x) : 1;
            specialSidespin = horizontalIntent * 72;
            momentumGain = 0;
            consumesSpecial = true;
        } else if (dropShot) {
            tier = 'dropShot';
            duration = 0.54;
            targetZ = -0.60;
            topspin = -42;
            specialSidespin = 0;
            momentumGain = 0;
            consumesSpecial = true;
        } else if (superSmash) {
            tier = 'superSmash';
            duration = 0.305;
            targetZ = -1.22;
            topspin = 158;
            momentumGain = 0;
            consumesSpecial = true;
        }

        return {
            tier,
            perfect,
            perfectSmash,
            superSmash,
            curveShot,
            dropShot,
            specialShot: consumesSpecial ? normalizedSpecial : null,
            consumesSpecial,
            specialSidespin,
            contactQuality,
            sweetSpotScore,
            duration,
            targetZ,
            topspin,
            momentumGain
        };
    }

    checkHit() {
        if (this.hitCooldown > 0) return;
        if (!this.physics.inPlay) return;

        if (window.gameInstance && window.gameInstance.isServe) return;

        const ball = this.physics.pos;
        const vel = this.physics.vel;


        if (!this.physics.hasBouncedOn('player')) {
            this.prevBallPos = { x: ball.x, y: ball.y, z: ball.z };
            return;
        }


        if (ball.z < 0.15) {
            this.prevBallPos = { x: ball.x, y: ball.y, z: ball.z };
            return;
        }
        if (vel.z < -0.1) {
            this.prevBallPos = { x: ball.x, y: ball.y, z: ball.z };
            return;
        }

        if (!this.prevBallPos) {
            this.prevBallPos = { x: ball.x, y: ball.y, z: ball.z };
        }



        const isPro = this.physics && typeof this.physics.isProMode === 'function' && this.physics.isProMode();
        const planeTolerance = isPro ? 0.010 : 0.015;
        const contactPlaneZ = this.pos.z - 0.027;
        const prevContactPlaneZ = this.prevPos.z - 0.027;

        let isHit = false;
        let isHandleHit = false;
        let contactX = ball.x;
        let contactY = ball.y;
        let finalContactZ = contactPlaneZ;
        let contactDistance = 0.5;


        const relZ0 = this.prevBallPos.z - prevContactPlaneZ;
        const relZ1 = ball.z - contactPlaneZ;


        if (relZ0 <= planeTolerance && relZ1 >= -planeTolerance) {
            const denom = relZ1 - relZ0;
            const t = Math.abs(denom) > 0.0001 ? Math.max(0, Math.min(1, -relZ0 / denom)) : 0.5;
            const bX = this.prevBallPos.x + t * (ball.x - this.prevBallPos.x);
            const bY = this.prevBallPos.y + t * (ball.y - this.prevBallPos.y);
            const pX = this.prevPos.x + t * (this.pos.x - this.prevPos.x);
            const pY = this.prevPos.y + t * (this.pos.y - this.prevPos.y);

            const dx = bX - pX;
            const dy = bY - pY;

            const contact = this.getBladeContact(dx, dy);
            if (contact.hit) {
                isHit = true;
                isHandleHit = contact.handle;
                contactX = bX;
                contactY = bY;
                contactDistance = contact.distance;
                finalContactZ = prevContactPlaneZ + t * (contactPlaneZ - prevContactPlaneZ);
            }
        }


        if (!isHit) {
            const relZ = ball.z - contactPlaneZ;

            const minRelZ = isPro ? -0.018 : -0.025;
            const maxRelZ = isPro ? 0.038 : 0.060;
            if (relZ >= minRelZ && relZ <= maxRelZ) {
                let dx = ball.x - this.pos.x;
                let dy = ball.y - this.pos.y;
                let contact = this.getBladeContact(dx, dy);
                let minDist = contact.distance;
                let isLowHit = contact.handle;
                let proximityHit = contact.hit;


                const dxTotal = this.pos.x - this.prevPos.x;
                if (Math.abs(dxTotal) > 0.02) {
                    const tSweep = Math.max(0, Math.min(1, (ball.x - this.prevPos.x) / dxTotal));
                    const sweepPX = this.prevPos.x + tSweep * dxTotal;
                    const sweepPY = this.prevPos.y + tSweep * (this.pos.y - this.prevPos.y);
                    const sweepBX = this.prevBallPos.x + tSweep * (ball.x - this.prevBallPos.x);
                    const sweepBY = this.prevBallPos.y + tSweep * (ball.y - this.prevBallPos.y);
                    const sDx = sweepBX - sweepPX;
                    const sDy = sweepBY - sweepPY;
                    const sweptContact = this.getBladeContact(sDx, sDy);
                    const sDist = sweptContact.distance;
                    if (sDist < minDist) {
                        minDist = sDist;
                        dx = sDx;
                        dy = sDy;
                        isLowHit = sweptContact.handle;
                        proximityHit = sweptContact.hit;
                    }
                }

                if (proximityHit) {
                    isHit = true;
                    isHandleHit = isLowHit;
                    contactX = ball.x;
                    contactY = ball.y;
                    contactDistance = minDist;
                    finalContactZ = contactPlaneZ;
                }
            }
        }

        this.prevBallPos = { x: ball.x, y: ball.y, z: ball.z };

        if (isHit) {

            this.physics.pos.x = contactX;
            this.physics.pos.y = contactY;
            this.physics.pos.z = finalContactZ;
            this.executeHit(isHandleHit, contactDistance);
        }
    }

    executeHit(isHandleHit = false, contactDistance = 0.5) {
        this.hitCooldown = 0.22;

        const swipeSpeed = this.velocity.speed;
        const ball = this.physics.pos;
        const isPro = this.physics && typeof this.physics.isProMode === 'function' && this.physics.isProMode();


        const isHighBall = ball.y > 0.88;
        const isSmash = !isHandleHit && isHighBall && ((this.isTouchActive || this.isTouchDevice) ? swipeSpeed > 850 : swipeSpeed > 1100);
        const isHard = !isHandleHit && ((this.isTouchActive || this.isTouchDevice) ? swipeSpeed > 450 : swipeSpeed > 600);


        let T = 0.50;
        if (isSmash) T = 0.38;
        else if (isHard) T = 0.44;

        let proTechnique = null;
        let proRallyPlan = null;
        let proSmashPlan = null;
        let arcadePlan = null;
        if (isPro) {
            proTechnique = this.getProStrokeTechnique(swipeSpeed, contactDistance, ball.y);
            if (isSmash) {
                proSmashPlan = this.getProSmashPlan(swipeSpeed, contactDistance, proTechnique);
                T = proSmashPlan.duration;
            } else {
                proRallyPlan = this.getProRallyPlan(swipeSpeed, contactDistance, ball.y, proTechnique);
                T = proRallyPlan.duration;
            }
        } else {
            const specialMode = window.gameInstance && typeof window.gameInstance.getArcadeSpecialMode === 'function'
                ? window.gameInstance.getArcadeSpecialMode()
                : ((window.gameInstance && typeof window.gameInstance.isArcadeSpecialReady === 'function' && window.gameInstance.isArcadeSpecialReady()) ? 'super' : null);
            arcadePlan = this.getArcadeHitPlan(
                swipeSpeed, contactDistance, ball.y, isSmash, isHard, isHandleHit, specialMode
            );
            T = arcadePlan.duration;
        }



        if (window.gameInstance && window.gameInstance.rallyCount) {
            const accel = Math.min(0.08, window.gameInstance.rallyCount * 0.012);
            T = Math.max(0.30, T - accel);
        }



        const contactOffsetX = (ball.x - this.pos.x) * 0.45;


        const swipeDirectionInfluence = (this.velocity.x / 1400) * 0.22;


        const racketAngleInfluence = -this.rot.y * 0.12;


        const racketPosOffset = this.pos.x * 0.10;


        let targetX = racketPosOffset + contactOffsetX + racketAngleInfluence + swipeDirectionInfluence;






        targetX = Math.max(-0.85, Math.min(0.85, targetX));




        let targetZ;
        let allowOut = false;
        if (isPro && isSmash && proSmashPlan) {
            targetZ = proSmashPlan.targetZ;
            allowOut = proSmashPlan.type === 'overhit';
        } else if (isPro && proRallyPlan) {
            targetZ = proRallyPlan.targetZ;
            allowOut = proRallyPlan.allowOut;
        } else {
            targetZ = arcadePlan ? arcadePlan.targetZ : (-0.75 - Math.min(0.45, (swipeSpeed / 1400) * 0.45));

            if (arcadePlan && (arcadePlan.perfect || arcadePlan.superSmash)) {
                targetX = Math.max(-0.62, Math.min(0.62, targetX));
            }
            if (arcadePlan && arcadePlan.curveShot) {
                const curveDir = Math.abs(this.velocity.x || 0) > 80 ? Math.sign(this.velocity.x) : (targetX >= 0 ? 1 : -1);
                targetX = Math.max(-0.66, Math.min(0.66, targetX + curveDir * 0.18));
            } else if (arcadePlan && arcadePlan.dropShot) {
                targetX = Math.max(-0.48, Math.min(0.48, targetX));
            }
        }



        const topspin = isPro
            ? ((isSmash && proSmashPlan) ? proSmashPlan.topspin : proTechnique.spinX)
            : (arcadePlan ? arcadePlan.topspin : (isSmash ? 110 : 45));
        const sidespin = isPro
            ? proTechnique.spinY
            : (arcadePlan && arcadePlan.specialSidespin !== null
                ? arcadePlan.specialSidespin
                : (targetX - this.pos.x) * 5);



        const forceNet = isPro && ((proRallyPlan && proRallyPlan.forceNet) || (proSmashPlan && proSmashPlan.forceNet));
        if (forceNet) {
            this.physics.hitTowards('player', targetX, targetZ, T, topspin, sidespin, false);
        } else {
            this.physics.hitTowards('player', targetX, targetZ, T, topspin, sidespin, allowOut);
        }


        const speed = Math.hypot(this.physics.vel.x, this.physics.vel.y, this.physics.vel.z);
        const kmh = Math.round(speed * 3.6);
        const panX = this.pos.x / 0.8;

        this.physics.isPlayerSmash = isSmash && !(arcadePlan && (arcadePlan.curveShot || arcadePlan.dropShot));
        this.physics.isPlayerHard = isHard;
        this.physics.playerShotSpeedKmh = kmh;
        this.physics.playerShotSpinX = this.physics.spin.x;
        this.physics.playerShotSpinY = this.physics.spin.y;
        this.physics.playerStrokeType = isPro && proTechnique
            ? proTechnique.type
            : (arcadePlan ? arcadePlan.tier : (isSmash ? 'smash' : 'drive'));
        this.physics.isPlayerSuperSmash = !isPro && !!(arcadePlan && arcadePlan.superSmash);

        if (!isPro && arcadePlan && window.gameInstance && typeof window.gameInstance.recordArcadeHit === 'function') {
            window.gameInstance.recordArcadeHit(arcadePlan, kmh);
        }

        if (isPro && proTechnique && window.gameInstance && typeof window.gameInstance.recordProTechnique === 'function') {
            const plan = isSmash ? proSmashPlan : proRallyPlan;
            window.gameInstance.recordProTechnique(proTechnique, {
                shotType: isSmash && proSmashPlan ? proSmashPlan.type : proTechnique.type,
                speedKmh: kmh,
                quality: isSmash && proSmashPlan ? proSmashPlan.quality : undefined,
                forceNet: !!(plan && plan.forceNet),
                allowOut: !!(plan && plan.allowOut),
                targetX,
                targetZ
            });
        }

        if (!isPro && arcadePlan && arcadePlan.curveShot) {
            this.triggerHaptic([18, 10, 18]);
            this.audio.play('smash', panX, 1.18);
            this.renderer.shake(0.028);
            if (window.gameInstance) {
                const label = window.i18n ? window.i18n.t('arcade_curve_shot') : '🌀 CURVE SHOT!';
                window.gameInstance.showCallout(`${label} ${kmh} km/h`, '#00e5ff', 950);
                if (typeof window.gameInstance.triggerArcadeHitStop === 'function') window.gameInstance.triggerArcadeHitStop(24);
                if (typeof window.gameInstance.triggerArcadeImpact === 'function') window.gameInstance.triggerArcadeImpact('perfect');
            }
        } else if (!isPro && arcadePlan && arcadePlan.dropShot) {
            this.triggerHaptic([10, 8]);
            this.audio.play('hit', panX, 0.90);
            if (window.gameInstance) {
                const label = window.i18n ? window.i18n.t('arcade_drop_shot') : '🎯 DROP SHOT!';
                window.gameInstance.showCallout(`${label} ${kmh} km/h`, '#69f0ae', 950);
                if (typeof window.gameInstance.triggerArcadeHitStop === 'function') window.gameInstance.triggerArcadeHitStop(16);
            }
        } else if (isSmash) {
            const arcadeSuper = !isPro && arcadePlan && arcadePlan.superSmash;
            const arcadePerfect = !isPro && arcadePlan && arcadePlan.perfectSmash;
            this.triggerHaptic(arcadeSuper ? [35, 25, 45] : [25, 30, 25]);
            this.audio.play('smash', panX, arcadeSuper ? 1.45 : (arcadePerfect ? 1.34 : 1.25));
            this.renderer.addSmashSparks(this.physics.pos);
            this.renderer.shake(arcadeSuper ? 0.070 : (arcadePerfect ? 0.055 : 0.045));
            if (!isPro && window.gameInstance) {
                if (typeof window.gameInstance.triggerArcadeHitStop === 'function') {
                    window.gameInstance.triggerArcadeHitStop(arcadeSuper ? 58 : (arcadePerfect ? 42 : 28));
                }
                if (typeof window.gameInstance.triggerArcadeImpact === 'function') {
                    window.gameInstance.triggerArcadeImpact(arcadeSuper ? 'super' : 'smash');
                }
            }
            if (window.gameInstance) {
                let smashLabel;
                let calloutColor = '#ff3d00';
                if (isPro) {
                    smashLabel = proSmashPlan && proSmashPlan.type === 'power'
                        ? '⚡ POWER SMASH!'
                        : (proSmashPlan && proSmashPlan.type === 'overhit' ? '⚠ OVERHIT!' : '⚡ SMASH!');
                } else if (arcadeSuper) {
                    smashLabel = window.i18n ? window.i18n.t('arcade_super_smash') : '⚡ SUPER SMASH!';
                    calloutColor = '#ffc400';
                } else if (arcadePerfect) {
                    smashLabel = window.i18n ? window.i18n.t('arcade_perfect_smash') : '✨ PERFECT SMASH!';
                    calloutColor = '#ff7a00';
                } else {
                    smashLabel = '⚡ SMASH!';
                }
                const sideLabel = isPro && proTechnique ? (proTechnique.strokeSide === 'forehand' ? 'FH' : 'BH') : '';
                window.gameInstance.showCallout(`${sideLabel ? sideLabel + ' ' : ''}${smashLabel} ${kmh} km/h`, calloutColor, 1100);
            }
        } else if (isHandleHit) {
            this.triggerHaptic([12, 12]);
            this.audio.play('smash', panX, 1.15);
            if (window.gameInstance) window.gameInstance.showCallout('EDGE!', '#ffd700', 600);
        } else if (isHard) {
            this.triggerHaptic(15);
            this.audio.play('smash', panX, 1.10);
            if (window.gameInstance) {
                if (isPro && proTechnique) {
                    const sideLabel = proTechnique.strokeSide === 'forehand' ? 'FH' : 'BH';
                    const typeLabel = proTechnique.type === 'topspin' ? 'TOPSPIN'
                        : (proTechnique.type === 'chop' ? 'CHOP'
                            : (proTechnique.type === 'sidespin' ? 'SIDESPIN' : 'DRIVE'));
                    window.gameInstance.showCallout(`${sideLabel} ${typeLabel} ${kmh} km/h`, '#00e5ff', 800);
                } else if (arcadePlan && arcadePlan.perfect) {
                    const label = window.i18n ? window.i18n.t('arcade_perfect_hit') : '✨ PERFECT HIT!';
                    window.gameInstance.showCallout(`${label} ${kmh} km/h`, '#ffc83b', 850);
                    this.renderer.addSmashSparks(this.physics.pos);
                    this.renderer.shake(0.024);
                    if (typeof window.gameInstance.triggerArcadeHitStop === 'function') window.gameInstance.triggerArcadeHitStop(18);
                    if (typeof window.gameInstance.triggerArcadeImpact === 'function') window.gameInstance.triggerArcadeImpact('perfect');
                } else {
                    window.gameInstance.showCallout(`DRIVE ${kmh} km/h`, '#00e5ff', 800);
                }
            }
        } else {
            this.triggerHaptic(10);
            this.audio.play('smash', panX, 0.95);
        }
    }
}

window.TableTennisController = TableTennisController;
