








const AI_PROFILES = {
    easy: {
        id: 'easy',
        name: 'Beginner',
        speed: 5.4,
        reactionDelay: 0.12,
        smashReactionDelay: 0.055,
        reachRadius: 0.096,
        smashReachRadius: 0.108,
        smashSpeedBurst: 1.15,
        trackingNoise: 0.024,
        predictionWeight: 0.70,
        recoveryRate: 0.50,

        baseError: 0.040,
        minErrorFloor: 0.015,
        maxErrorChance: 0.22,
        pressureSensitivity: 0.22,
        rallySensitivity: 0.012,

        basePopupChance: 0.10,
        popupPressureSensitivity: 0.18,
        baseWeakReturnChance: 0.08,
        weakReturnSensitivity: 0.14,


        smashPopupChance: 0.38,



        proErrorMultiplier: 1.15,
        errorOutChance: 0.50,
        errorNetChance: 0.30,
        errorPopupChance: 0.20,

        minAttackChance: 0.0,
        maxAttackChance: 0.0,

        targetSpreadX: 0.28,
        targetDepthZ: [0.82, 0.94],
        baseFlightTime: [0.50, 0.56],
        baseTopspin: 20,
        maxSidespin: 3,

        useCombinations: false
    },
    medium: {
        id: 'medium',
        name: 'Club',
        speed: 6.6,
        reactionDelay: 0.080,
        smashReactionDelay: 0.030,
        reachRadius: 0.098,
        smashReachRadius: 0.118,
        smashSpeedBurst: 1.25,
        trackingNoise: 0.016,
        predictionWeight: 0.84,
        recoveryRate: 0.72,

        baseError: 0.022,
        minErrorFloor: 0.008,
        maxErrorChance: 0.16,
        pressureSensitivity: 0.16,
        rallySensitivity: 0.008,

        basePopupChance: 0.08,
        popupPressureSensitivity: 0.16,
        baseWeakReturnChance: 0.08,
        weakReturnSensitivity: 0.12,


        smashPopupChance: 0.22,

        proErrorMultiplier: 1.05,
        errorOutChance: 0.42,
        errorNetChance: 0.22,
        errorPopupChance: 0.36,

        minAttackChance: 0.10,
        maxAttackChance: 0.30,

        targetSpreadX: 0.35,
        targetDepthZ: [0.84, 0.96],
        baseFlightTime: [0.42, 0.48],
        baseTopspin: 44,
        maxSidespin: 12,

        useCombinations: false
    },
    hard: {
        id: 'hard',
        name: 'Champion',
        speed: 6.9,
        reactionDelay: 0.075,
        smashReactionDelay: 0.015,
        reachRadius: 0.100,
        smashReachRadius: 0.128,
        smashSpeedBurst: 1.38,
        trackingNoise: 0.014,
        predictionWeight: 0.84,
        recoveryRate: 0.76,

        baseError: 0.018,
        minErrorFloor: 0.006,
        maxErrorChance: 0.15,
        pressureSensitivity: 0.15,
        rallySensitivity: 0.006,

        basePopupChance: 0.07,
        popupPressureSensitivity: 0.14,
        baseWeakReturnChance: 0.06,
        weakReturnSensitivity: 0.10,


        smashPopupChance: 0.12,

        proErrorMultiplier: 0.96,
        errorOutChance: 0.34,
        errorNetChance: 0.16,
        errorPopupChance: 0.50,

        minAttackChance: 0.12,
        maxAttackChance: 0.40,

        targetSpreadX: 0.40,
        targetDepthZ: [0.86, 1.00],
        baseFlightTime: [0.40, 0.46],
        baseTopspin: 56,
        maxSidespin: 16,

        useCombinations: true
    }
};

const AI_ARCHETYPES = {
    titan: {
        id: 'titan',
        preferredZ: -1.48,
        speedMult: 1.06,
        reactionDelayMult: 0.85,
        baseTopspinBonus: 14,
        maxSidespinBonus: 8,
        attackChanceMult: 1.25,
        chopChance: 0.08,
        dropShotChance: 0.16,
        chiquitaChance: 0.35,
        edgeAimChance: 0.28,
        cornerTracking: true,
        clutchMultiplier: 0.50
    },
    speed_counter: {
        id: 'speed_counter',
        preferredZ: -1.40,
        speedMult: 1.05,
        reactionDelayMult: 0.80,
        baseTopspinBonus: 4,
        maxSidespinBonus: 4,
        attackChanceMult: 1.15,
        chopChance: 0.04,
        dropShotChance: 0.06,
        chiquitaChance: 0.18,
        edgeAimChance: 0.22,
        cornerTracking: true,
        clutchMultiplier: 0.65
    },
    spin_loop: {
        id: 'spin_loop',
        preferredZ: -1.58,
        speedMult: 0.98,
        reactionDelayMult: 0.95,
        baseTopspinBonus: 22,
        maxSidespinBonus: 14,
        attackChanceMult: 1.10,
        chopChance: 0.12,
        dropShotChance: 0.08,
        chiquitaChance: 0.22,
        edgeAimChance: 0.18,
        cornerTracking: false,
        clutchMultiplier: 0.70
    },
    defensive_wall: {
        id: 'defensive_wall',
        preferredZ: -1.54,
        speedMult: 0.96,
        reactionDelayMult: 0.90,
        baseTopspinBonus: -10,
        maxSidespinBonus: 6,
        attackChanceMult: 0.65,
        chopChance: 0.42,
        dropShotChance: 0.14,
        chiquitaChance: 0.06,
        edgeAimChance: 0.12,
        cornerTracking: false,
        clutchMultiplier: 0.60
    },
    power_attack: {
        id: 'power_attack',
        preferredZ: -1.46,
        speedMult: 1.02,
        reactionDelayMult: 0.92,
        baseTopspinBonus: 10,
        maxSidespinBonus: 4,
        attackChanceMult: 1.45,
        chopChance: 0.02,
        dropShotChance: 0.04,
        chiquitaChance: 0.10,
        edgeAimChance: 0.25,
        cornerTracking: true,
        clutchMultiplier: 0.75
    }
};

class TableTennisAI {
    constructor(physics, renderer, audio) {
        this.physics = physics;
        this.renderer = renderer;
        this.audio = audio;


        this.TABLE_SURFACE_Y = this.physics.TABLE_SURFACE_Y || 0.76;
        this.TABLE_HALF_W = this.physics.TABLE_HALF_W || 0.7625;
        this.TABLE_HALF_L = this.physics.TABLE_HALF_L || 1.37;
        this.NET_Y = this.physics.NET_Y || 0.9125;
        this.NET_TOP_Y = this.NET_Y;


        this.pos = { x: 0, y: 0.98, z: -1.52 };
        this.prevPos = { x: 0, y: 0.98, z: -1.52 };
        this.targetPos = { x: 0, y: 0.98, z: -1.52 };
        this.startPosWhenHit = { x: 0, y: 0.98, z: -1.52 };
        this.reactionTimer = 0;
        this.lastSeenHitter = null;
        this.rot = { x: 0, y: 0, z: 0 };
        this.prevBallPos = null;


        this.difficulty = 'medium';
        this.archetype = 'speed_counter';
        this.archetypeConfig = AI_ARCHETYPES.speed_counter;
        this.profile = { ...AI_PROFILES.medium };


        this.hitCooldown = 0;
        this.isSwinging = false;
        this.swingTime = 0;
        this.currentShotType = 'rally';
        this.rallyHitCount = 0;


        this.memory = {
            lastTargets: [],
            playerPositions: [],
            previousShotType: null,
            recentShotTypes: [],
            comboState: 0
        };
    }

    setArchetype(archetypeKey) {
        if (!AI_ARCHETYPES[archetypeKey]) archetypeKey = 'speed_counter';
        this.archetype = archetypeKey;
        this.archetypeConfig = AI_ARCHETYPES[archetypeKey];
        this.setDifficulty(this.difficulty);
    }

    setDifficulty(level) {
        if (!AI_PROFILES[level]) return;
        this.difficulty = level;
        this.profile = { ...AI_PROFILES[level] };
        if (this.archetypeConfig) {
            this.profile.speed *= (this.archetypeConfig.speedMult || 1.0);
            this.profile.reactionDelay *= (this.archetypeConfig.reactionDelayMult || 1.0);
            if (this.profile.smashReactionDelay) {
                this.profile.smashReactionDelay *= (this.archetypeConfig.reactionDelayMult || 1.0);
            }
            this.profile.baseTopspin += (this.archetypeConfig.baseTopspinBonus || 0);
            this.profile.maxSidespin += (this.archetypeConfig.maxSidespinBonus || 0);
            this.profile.maxAttackChance *= (this.archetypeConfig.attackChanceMult || 1.0);
        }
    }








    applyTournamentCountryCalibration(baseDifficulty, oppCountry, mods = null) {
        if (!AI_PROFILES[baseDifficulty]) baseDifficulty = 'medium';
        this.difficulty = baseDifficulty;

        const archKey = (mods && mods.archetype) || (oppCountry && oppCountry.archetype) || 'speed_counter';
        this.archetype = archKey;
        this.archetypeConfig = AI_ARCHETYPES[archKey] || AI_ARCHETYPES.speed_counter;


        this.profile = { ...AI_PROFILES[baseDifficulty] };


        if (this.archetypeConfig) {
            this.profile.speed *= (this.archetypeConfig.speedMult || 1.0);
            this.profile.reactionDelay *= (this.archetypeConfig.reactionDelayMult || 1.0);
            if (this.profile.smashReactionDelay) {
                this.profile.smashReactionDelay *= (this.archetypeConfig.reactionDelayMult || 1.0);
            }
            this.profile.baseTopspin += (this.archetypeConfig.baseTopspinBonus || 0);
            this.profile.maxSidespin += (this.archetypeConfig.maxSidespinBonus || 0);
            this.profile.maxAttackChance *= (this.archetypeConfig.attackChanceMult || 1.0);
        }


        const countryRating = (oppCountry && typeof oppCountry.rating === 'number') ? oppCountry.rating : 90;
        const ratingDelta = (countryRating - 90) / 10;


        this.profile.speed *= (1.0 + ratingDelta * 0.04);


        this.profile.reactionDelay = Math.max(0.055, this.profile.reactionDelay * (1.0 - ratingDelta * 0.06));
        if (this.profile.smashReactionDelay) {
            this.profile.smashReactionDelay = Math.max(0.010, this.profile.smashReactionDelay * (1.0 - ratingDelta * 0.08));
        }


        this.profile.baseError = Math.max(0.005, this.profile.baseError * (1.0 - ratingDelta * 0.12));
        this.profile.maxErrorChance = Math.max(0.04, this.profile.maxErrorChance * (1.0 - ratingDelta * 0.12));


        this.profile.basePopupChance = Math.max(0.03, this.profile.basePopupChance * (1.0 - ratingDelta * 0.14));
        if (this.profile.smashPopupChance) {
            this.profile.smashPopupChance = Math.max(0.05, this.profile.smashPopupChance * (1.0 - ratingDelta * 0.12));
        }


        this.profile.baseTopspin = Math.max(10, this.profile.baseTopspin + Math.round(ratingDelta * 6));


        if (mods) {
            if (mods.speedMult) this.profile.speed *= mods.speedMult;
            if (mods.reactionDelayMult) {
                this.profile.reactionDelay *= mods.reactionDelayMult;
                if (this.profile.smashReactionDelay) this.profile.smashReactionDelay *= mods.reactionDelayMult;
            }
            if (mods.topspinBonus) this.profile.baseTopspin += mods.topspinBonus;
            if (mods.sidespinBonus) this.profile.maxSidespin += mods.sidespinBonus;
            if (mods.attackChanceMult) this.profile.maxAttackChance *= mods.attackChanceMult;
        }
    }

    resetPointState() {



        this.reactionTimer = 0;
        this.lastSeenHitter = null;
        this.prevBallPos = null;
        this.hitCooldown = 0;
        this.isSwinging = false;
        this.swingTime = 0;
        this.currentShotType = 'rally';
        this.rallyHitCount = 0;
        this.memory.lastTargets = [];
        this.memory.playerPositions = [];
        this.memory.previousShotType = null;
        this.memory.recentShotTypes = [];
        this.memory.comboState = 0;
    }

    reset() {
        this.pos = { x: 0, y: 0.98, z: -1.52 };
        this.prevPos = { x: 0, y: 0.98, z: -1.52 };
        this.targetPos = { x: 0, y: 0.98, z: -1.52 };
        this.startPosWhenHit = { x: 0, y: 0.98, z: -1.52 };
        this.rot = { x: 0, y: 0, z: 0 };
        this.resetPointState();
    }

    update(dt) {
        this.hitCooldown = Math.max(0, this.hitCooldown - dt);

        this.prevPos.x = this.pos.x;
        this.prevPos.y = this.pos.y;
        this.prevPos.z = this.pos.z;

        const isSmash = !!this.physics.isPlayerSmash;


        if (this.physics.inPlay && this.physics.lastHitter === 'player' && this.lastSeenHitter !== 'player') {
            this.lastSeenHitter = 'player';
            this.startPosWhenHit = { x: this.pos.x, y: this.pos.y, z: this.pos.z };
            const baseDelay = isSmash
                ? (this.profile.smashReactionDelay !== undefined ? this.profile.smashReactionDelay : (this.profile.reactionDelay * 0.35))
                : (this.profile.reactionDelay || 0.12);
            this.reactionTimer = baseDelay;
        } else if (this.physics.lastHitter === 'opponent') {
            this.lastSeenHitter = 'opponent';
        }

        if (this.reactionTimer > 0) {
            this.reactionTimer -= dt;
        }


        this.perceiveBall(dt);


        let effectiveSpeed = this.profile.speed;
        if (isSmash) {
            effectiveSpeed *= (this.profile.smashSpeedBurst || 1.25);
        }
        const lerpFactor = 1 - Math.exp(-effectiveSpeed * dt);
        this.pos.x += (this.targetPos.x - this.pos.x) * lerpFactor;
        this.pos.y += (this.targetPos.y - this.pos.y) * lerpFactor;
        this.pos.z += (this.targetPos.z - this.pos.z) * lerpFactor;


        if (Math.abs(this.pos.x) < this.TABLE_HALF_W + 0.05 && this.pos.z > -this.TABLE_HALF_L - 0.03) {
            this.pos.z = -this.TABLE_HALF_L - 0.03;
            if (this.pos.y < this.TABLE_SURFACE_Y + 0.19) {
                this.pos.y = this.TABLE_SURFACE_Y + 0.19;
            }
        }


        let targetTiltY = 0;
        let targetTiltZ = 0;
        let targetTiltX = 0;

        if (this.pos.x <= 0) {
            targetTiltY = 0.22 - (this.pos.x * 0.22);
            targetTiltZ = 0.18 - (this.pos.x * 0.18);
        } else {
            targetTiltY = -0.26 - (this.pos.x * 0.22);
            targetTiltZ = -0.24 - (this.pos.x * 0.18);
        }

        if (this.isSwinging) {
            this.swingTime += dt;
            targetTiltX = this.currentShotType === 'smash' ? -0.58 : -0.40;
            if (this.swingTime > 0.20) {
                this.isSwinging = false;
                this.swingTime = 0;
            }
        }

        this.rot.x += (targetTiltX - this.rot.x) * (1 - Math.exp(-22 * dt));
        this.rot.y += (targetTiltY - this.rot.y) * (1 - Math.exp(-22 * dt));
        this.rot.z += (targetTiltZ - this.rot.z) * (1 - Math.exp(-22 * dt));


        this.checkHit();
    }

    perceiveBall(dt) {
        const ball = this.physics.pos;
        const vel = this.physics.vel;
        const isHeadingToAI = this.physics.inPlay && (vel.z < 0 || ball.z < 0.25);

        if (isHeadingToAI) {
            const isSmash = !!this.physics.isPlayerSmash;



            if (this.reactionTimer > 0 && !this.physics.hasBouncedOn('opponent')) {
                if (!isSmash || ball.z > 0.05) {
                    return;
                }
            }


            let interceptZ = -1.48;
            if (ball.z < -1.25) {
                interceptZ = Math.max(-1.75, ball.z - 0.08);
            }

            const vz = Math.min(-0.5, vel.z);
            const tToIntercept = Math.max(0, (interceptZ - ball.z) / vz);


            const predX = ball.x + vel.x * tToIntercept;
            const g = -9.81;
            let predY = ball.y + vel.y * tToIntercept + 0.5 * g * tToIntercept * tToIntercept;


            if (!this.physics.hasBouncedOn('opponent') && predY < 0.78) {
                if (isSmash) {


                    predY = 0.84 + Math.max(0, Math.min(0.06, -vel.z * 0.005));
                } else {
                    predY = 0.78 + Math.abs(predY - 0.78) * 0.82;
                }
            }


            const noiseMult = isSmash ? 0.35 : 1.0;
            const noise = (this.profile.trackingNoise || 0.012) * noiseMult * Math.sin(this.rallyHitCount * 2.7 + ball.z * 5.1);
            const desiredX = predX + noise;
            const desiredY = predY;

            this.targetPos.x = Math.max(-0.85, Math.min(0.85, desiredX));
            this.targetPos.z = interceptZ;


            const isOverTable = (this.targetPos.z > -this.TABLE_HALF_L && Math.abs(this.targetPos.x) < this.TABLE_HALF_W);
            const minY = isOverTable ? (this.TABLE_SURFACE_Y + 0.12) : 0.68;
            this.targetPos.y = Math.max(minY, Math.min(1.22, desiredY));

        } else {

            this.recoverPosition(dt);
        }
    }

    recoverPosition(dt) {
        if (!this.physics.inPlay) {
            this.targetPos.x = 0;
            this.targetPos.y = 0.98;
            this.targetPos.z = -1.52;
            return;
        }

        if (this.difficulty === 'easy') {
            this.targetPos.x *= (1 - this.profile.recoveryRate * dt * 2);
        } else if (this.difficulty === 'medium') {
            this.targetPos.x *= (1 - this.profile.recoveryRate * dt * 5);
        } else if (this.difficulty === 'hard') {
            const playerPos = window.playerController ? window.playerController.pos : { x: 0 };
            const anticipatedX = -playerPos.x * 0.20;
            this.targetPos.x += (anticipatedX - this.targetPos.x) * (1 - Math.exp(-6 * dt));
        }

        this.targetPos.y = 0.98;
        this.targetPos.z = -1.52;
    }

    checkHit() {
        if (this.hitCooldown > 0) return;
        if (!this.physics.inPlay) return;
        if (window.gameInstance && window.gameInstance.isServe) return;


        if (!this.physics.hasBouncedOn('opponent')) {
            this.prevBallPos = { x: this.physics.pos.x, y: this.physics.pos.y, z: this.physics.pos.z };
            return;
        }

        const ball = this.physics.pos;
        const vel = this.physics.vel;

        if (ball.z > -0.30 || vel.z > 0.1) {
            this.prevBallPos = { x: ball.x, y: ball.y, z: ball.z };
            return;
        }

        const isSmash = !!this.physics.isPlayerSmash;
        const baseReach = isSmash
            ? (this.profile.smashReachRadius || 0.118)
            : (this.profile.reachRadius || 0.105);


        const reach = isSmash ? baseReach : (baseReach * (this.physics.isProMode && this.physics.isProMode() ? 0.92 : 1.0));
        const vertAspect = isSmash ? 1.35 : 1.18;

        if (!this.prevBallPos) {
            this.prevBallPos = { x: ball.x, y: ball.y, z: ball.z };
        }


        const contactPlaneZ = this.pos.z + 0.027;
        const prevContactPlaneZ = this.prevPos.z + 0.027;

        let isHit = false;
        let crossedPlane = false;
        let missDist = 999;
        let contactX = ball.x;
        let contactY = ball.y;
        let finalContactZ = contactPlaneZ;


        const relZ0 = this.prevBallPos.z - prevContactPlaneZ;
        const relZ1 = ball.z - contactPlaneZ;
        const planeTol = isSmash ? 0.010 : 0.005;

        if (relZ0 >= -planeTol && relZ1 <= planeTol) {
            crossedPlane = true;
            const denom = relZ0 - relZ1;
            const t = Math.abs(denom) > 0.0001 ? Math.max(0, Math.min(1, relZ0 / denom)) : 0.5;
            const bX = this.prevBallPos.x + t * (ball.x - this.prevBallPos.x);
            const bY = this.prevBallPos.y + t * (ball.y - this.prevBallPos.y);
            const pX = this.prevPos.x + t * (this.pos.x - this.prevPos.x);
            const pY = this.prevPos.y + t * (this.pos.y - this.prevPos.y);
            const r = Math.hypot(bX - pX, (bY - pY) / vertAspect);
            missDist = r;
            if (r <= reach) {
                isHit = true;
                contactX = bX;
                contactY = bY;
                finalContactZ = prevContactPlaneZ + t * (contactPlaneZ - prevContactPlaneZ);
            }
        }


        if (!isHit) {
            const dz = Math.abs(ball.z - contactPlaneZ);
            const r = Math.hypot(ball.x - this.pos.x, (ball.y - this.pos.y) / vertAspect);
            const faceTolerance = isSmash ? 0.040 : ((this.physics.isProMode && this.physics.isProMode()) ? 0.020 : 0.025);
            if (dz <= faceTolerance && r <= reach) {
                isHit = true;
                contactX = ball.x;
                contactY = ball.y;
                finalContactZ = contactPlaneZ;
            }
        }

        this.prevBallPos = { x: ball.x, y: ball.y, z: ball.z };

        if (isHit) {

            this.physics.pos.x = contactX;
            this.physics.pos.y = contactY;
            this.physics.pos.z = finalContactZ;
            this.executeHit();
        } else if (crossedPlane && missDist < 0.25) {

            this.isSwinging = true;
            this.swingTime = 0;
            this.hitCooldown = 0.40;
        }
    }

    executeHit() {
        this.hitCooldown = 0.26;
        this.isSwinging = true;
        this.swingTime = 0;
        this.rallyHitCount++;

        const ball = this.physics.pos;
        const vel = this.physics.vel;
        const playerPos = window.playerController ? window.playerController.pos : { x: 0, y: 0.95, z: 1.25 };

        const isSmash = !!this.physics.isPlayerSmash;
        const isSuperSmash = !!this.physics.isPlayerSuperSmash;



        if (isSmash) {
            const roll = Math.random();
            const popupThreshold = isSuperSmash && !(this.physics.isProMode && this.physics.isProMode())
                ? Math.max(0.78, this.profile.smashPopupChance || 0.50)
                : (this.profile.smashPopupChance !== undefined ? this.profile.smashPopupChance : 0.22);

            if (roll < popupThreshold) {

                const target = this.chooseTarget('popup', 'weakPopup', playerPos);
                this.executeShot('popup', target, 'weakPopup');
                return;
            }





            const arch = this.archetypeConfig || AI_ARCHETYPES.speed_counter;
            let smashDefShot = 'block';

            if (arch.id === 'defensive_wall' || Math.random() < (arch.chopChance || 0.10) * 1.5) {
                smashDefShot = 'chop';
            } else if (this.difficulty === 'hard' && (arch.id === 'titan' || arch.id === 'speed_counter') && Math.random() < 0.35) {
                smashDefShot = 'counter';
            } else {
                smashDefShot = 'block';
            }

            const target = this.chooseTarget(smashDefShot, 'cleanReturn', playerPos);
            this.executeShot(smashDefShot, target, 'cleanReturn');
            return;
        }


        const pressureContext = this.evaluatePressure(ball, vel, playerPos);


        const responseQuality = this.chooseResponseQuality(pressureContext);


        if (responseQuality === 'forcedError') {
            this.chooseErrorOutcome(pressureContext, false);
            return;
        }


        const opportunityScore = this.evaluateOpportunity(ball, vel, playerPos, pressureContext.movementStrain);


        const shotType = this.chooseShot(opportunityScore, responseQuality, playerPos);
        const target = this.chooseTarget(shotType, responseQuality, playerPos);


        this.executeShot(shotType, target, responseQuality);
    }

    evaluatePressure(ball, vel, playerPos) {
        const speedKmh = Math.hypot(vel.x, vel.y, vel.z) * 3.6;
        const distMoved = Math.hypot(this.pos.x - this.startPosWhenHit.x, this.pos.z - this.startPosWhenHit.z);
        const paddleToBallDist = Math.hypot(ball.x - this.pos.x, ball.y - this.pos.y, ball.z - this.pos.z);

        const movementStrain = Math.min(1, Math.max(0, distMoved / 0.85));
        const speedPressure = Math.min(1, Math.max(0, (speedKmh - 32) / 48));
        const lowBallPressure = Math.min(1, Math.max(0, (this.NET_TOP_Y + 0.04 - ball.y) / 0.20));
        const stretchPressure = Math.min(1, Math.max(0, paddleToBallDist / 0.22));
        const rallyPressure = this.profile.rallySensitivity * Math.min(1, this.rallyHitCount / 10);

        const pressure = (
            movementStrain     * 0.25 +
            speedPressure      * 0.20 +
            lowBallPressure    * 0.15 +
            stretchPressure    * 0.25 +
            rallyPressure      * 0.15
        );

        const easyBallBonus = (1 - speedPressure) * (1 - movementStrain) * (1 - lowBallPressure) * 0.04;

        let clutchMultiplier = 1.0;
        if (window.gameInstance) {
            const pScore = window.gameInstance.playerScore || 0;
            const oScore = window.gameInstance.opponentScore || 0;
            const isDeuce = pScore >= 9 && oScore >= 9;
            const isClutch = oScore >= 10 || pScore >= 10 || isDeuce;
            if (isClutch) {
                clutchMultiplier = (this.archetypeConfig && this.archetypeConfig.clutchMultiplier) || 0.65;
            }
        }

        const physicsErrorMultiplier = (this.physics.isProMode && this.physics.isProMode())
            ? (this.profile.proErrorMultiplier || 1.0)
            : 1.0;

        const errorChance = Math.min(
            this.profile.maxErrorChance,
            Math.max(
                this.profile.minErrorFloor,
                (this.profile.baseError + pressure * this.profile.pressureSensitivity - easyBallBonus)
                    * clutchMultiplier * physicsErrorMultiplier
            )
        );

        return {
            pressure,
            errorChance,
            movementStrain,
            speedPressure,
            lowBallPressure,
            stretchPressure,
            ball,
            vel,
            speedKmh
        };
    }

    chooseResponseQuality(context) {
        if (Math.random() < context.errorChance) {
            return 'forcedError';
        }

        const popupChance = this.profile.basePopupChance + context.pressure * this.profile.popupPressureSensitivity;
        const weakReturnChance = this.profile.baseWeakReturnChance + context.pressure * this.profile.weakReturnSensitivity;

        const roll = Math.random();
        if (roll < popupChance) {
            return 'weakPopup';
        } else if (roll < popupChance + weakReturnChance) {
            return 'weakReturn';
        }

        return 'cleanReturn';
    }

    chooseProErrorType(context, roll = Math.random(), isForcedBySmash = false) {
        const lowBallPressure = context ? (context.lowBallPressure || 0) : 0;
        const movementStrain = context ? (context.movementStrain || 0) : 0;
        const speedPressure = context ? (context.speedPressure || 0) : 0;
        const stretchPressure = context ? (context.stretchPressure || 0) : 0;
        const pressure = context ? (context.pressure || 0) : 0;


        let netWeight = (this.profile.errorNetChance || 0) * (0.70 + lowBallPressure * 1.15);
        let outWeight = (this.profile.errorOutChance || 0)
            * (0.72 + (movementStrain + speedPressure + stretchPressure) / 3 * 0.78);
        let popupWeight = (this.profile.errorPopupChance || 0) * (1.08 - pressure * 0.28);

        if (isForcedBySmash) {
            outWeight *= 1.22;
            netWeight *= 0.88;
            popupWeight *= 0.90;
        }

        const total = Math.max(0.0001, netWeight + outWeight + popupWeight);
        const normalizedRoll = Math.max(0, Math.min(0.999999, roll));
        const netCut = netWeight / total;
        const outCut = netCut + outWeight / total;

        if (normalizedRoll < netCut) return 'net';
        if (normalizedRoll < outCut) return 'out';
        return 'popup';
    }

    chooseErrorOutcome(context, isForcedBySmash = false) {
        const playerPos = window.playerController ? window.playerController.pos : { x: 0 };
        const isPro = this.physics.isProMode && this.physics.isProMode();


        if (!isPro) {
            this.currentShotType = 'popup';
            const target = this.chooseTarget('popup', 'weakPopup', playerPos);
            this.executeShot('popup', target, 'weakPopup');
            return;
        }

        const errorType = this.chooseProErrorType(context, Math.random(), isForcedBySmash);

        if (errorType === 'net') {
            this.currentShotType = 'errorNet';
            if (this.audio) this.audio.play('block', this.pos.x / 0.8, 0.82);
            this.physics.hitIntoNet('opponent');
            return;
        }

        if (errorType === 'out') {
            this.currentShotType = 'errorOut';
            const pressure = context ? (context.pressure || 0) : 0;
            const stretch = context ? (context.stretchPressure || 0) : 0;
            const sprayWide = Math.random() < (0.52 + stretch * 0.20);
            const side = (this.pos.x > 0.06) ? 1 : (this.pos.x < -0.06 ? -1 : (Math.random() < 0.5 ? -1 : 1));

            let targetX;
            let targetZ;
            if (sprayWide) {
                targetX = side * (this.TABLE_HALF_W + 0.16 + Math.random() * 0.16);
                targetZ = 0.82 + Math.random() * 0.28;
            } else {
                targetX = (Math.random() - 0.5) * 0.56;
                targetZ = this.TABLE_HALF_L + 0.16 + Math.random() * 0.22;
            }

            const T = Math.max(0.34, 0.46 - pressure * 0.07);
            const topspin = Math.max(8, this.profile.baseTopspin * 0.70);
            const sidespin = sprayWide ? side * Math.min(12, this.profile.maxSidespin || 0) : 0;
            this.physics.hitTowards('opponent', targetX, targetZ, T, topspin, sidespin, true);
            if (this.audio) this.audio.play('smash', this.pos.x / 0.8, 0.92);
            return;
        }


        this.currentShotType = 'popup';
        const target = this.chooseTarget('popup', 'weakPopup', playerPos);
        this.executeShot('popup', target, 'weakPopup');
    }

    evaluateOpportunity(ball, vel, playerPos, movementStrain) {
        const speedKmh = Math.hypot(vel.x, vel.y, vel.z) * 3.6;

        const heightQuality = Math.min(1, Math.max(0, (ball.y - this.TABLE_SURFACE_Y) / 0.25));
        const slowBallBonus = Math.min(1, Math.max(0, (52 - speedKmh) / 26));
        const centerBall = 1 - Math.min(1, Math.abs(ball.x) / (this.TABLE_HALF_W * 0.7));
        const aiBalance = 1 - movementStrain;
        const playerOpenSide = Math.min(1, Math.abs(playerPos.x) / (this.TABLE_HALF_W * 0.6));

        return Math.min(1, Math.max(0,
            heightQuality  * 0.30 +
            slowBallBonus  * 0.25 +
            centerBall     * 0.15 +
            aiBalance      * 0.20 +
            playerOpenSide * 0.10
        ));
    }

    chooseShot(opportunityScore, responseQuality, playerPos) {
        if (responseQuality === 'weakPopup') {
            return 'popup';
        }
        if (responseQuality === 'weakReturn') {
            return 'weak';
        }
        if (responseQuality === 'block') {
            return 'block';
        }


        if (this.difficulty === 'easy') {
            return 'rally';
        }

        const arch = this.archetypeConfig || AI_ARCHETYPES.speed_counter;
        const previousShot = this.memory.previousShotType;


        const repeatPenalty = (shotType) => previousShot === shotType ? 0.28 : 1.0;


        if (window.gameInstance && window.gameInstance.isServe
            && Math.random() < arch.chiquitaChance * repeatPenalty('chiquita')) {
            return 'chiquita';
        }


        if (playerPos.z > 2.20 && Math.random() < arch.dropShotChance * repeatPenalty('dropShot')) {
            return 'dropShot';
        }


        if ((arch.id === 'defensive_wall' || this.physics.isPlayerSmash)
            && Math.random() < arch.chopChance * repeatPenalty('chop')) {
            return 'chop';
        }

        const attackProb = this.profile.minAttackChance +
            (this.profile.maxAttackChance - this.profile.minAttackChance) * opportunityScore;

        if (Math.random() < attackProb) {
            if (opportunityScore > 0.70) {
                return 'smash';
            } else if (Math.random() < arch.edgeAimChance) {
                return 'edgeKiller';
            } else if (this.difficulty === 'hard' && this.memory.comboState === 1) {
                return 'counter';
            } else if (this.difficulty === 'hard' && Math.random() < 0.30) {
                return 'curve';
            }
            return 'drive';
        }

        return 'rally';
    }

    chooseTarget(shotType, responseQuality, playerPos) {
        this.currentShotType = shotType;
        const arch = this.archetypeConfig || AI_ARCHETYPES.speed_counter;
        const playerX = playerPos.x;
        let targetX = 0;
        let targetZ = 0.88;
        let T = 0.48;
        let topspin = this.profile.baseTopspin;
        let sidespin = 0;
        let shotCallout = null;
        let calloutColor = '#00e5ff';

        if (shotType === 'block') {
            this.currentShotType = 'block';

            const openSide = playerX >= 0 ? -0.34 : 0.34;
            targetX = openSide * (0.65 + Math.random() * 0.35);
            targetZ = 0.88 + Math.random() * 0.18;
            T = this.difficulty === 'hard' ? 0.40 : (this.difficulty === 'medium' ? 0.43 : 0.46);
            topspin = 24;
            sidespin = (targetX - this.pos.x) * 1.6;
            shotCallout = window.i18n ? window.i18n.t('ai_block') : 'REFLEKS BLOK! 🛡️';
            calloutColor = '#00e5ff';

        } else if (shotType === 'popup') {

            targetX = (Math.random() - 0.5) * 0.15;
            targetZ = 0.85;
            T = 0.64;
            topspin = -10;
            shotCallout = window.i18n ? window.i18n.t('weak_return_callout') : 'ZAYIF SAVUNMA! 🏓';
            calloutColor = '#ffb300';

        } else if (shotType === 'weak') {
            targetX = (Math.random() - 0.5) * 0.20;
            targetZ = 0.88;
            T = 0.56;
            topspin = 15;

        } else if (shotType === 'chop') {
            this.currentShotType = 'chop';
            targetX = (Math.random() - 0.5) * 0.40;
            targetZ = 0.94 + Math.random() * 0.10;
            T = 0.52;
            topspin = -24;
            sidespin = (targetX - this.pos.x) * 2;
            shotCallout = window.i18n ? window.i18n.t('ai_chop') : 'AĞIR KESME! 🛡️';
            calloutColor = '#00e5ff';

        } else if (shotType === 'dropShot') {
            this.currentShotType = 'dropShot';
            targetX = (Math.random() - 0.5) * 0.38;
            targetZ = 0.35;
            T = 0.56;
            topspin = -12;
            sidespin = 0;
            shotCallout = window.i18n ? window.i18n.t('ai_drop') : 'KISA BIRAKIŞ! 🪶';
            calloutColor = '#ffc83b';

        } else if (shotType === 'chiquita') {
            this.currentShotType = 'chiquita';
            const openCorner = playerX >= 0 ? -0.38 : 0.38;
            targetX = openCorner;
            targetZ = 0.92;
            T = 0.39;
            topspin = 58;
            sidespin = Math.sign(openCorner) * 22;
            shotCallout = window.i18n ? window.i18n.t('ai_chiquita') : 'MUZ VURUŞU! 🍌';
            calloutColor = '#e040fb';

        } else if (shotType === 'edgeKiller') {
            this.currentShotType = 'edgeKiller';
            const edgeSide = Math.random() < 0.5 ? -0.42 : 0.42;
            targetX = edgeSide;
            targetZ = 1.02;
            T = 0.38;
            topspin = 64;
            sidespin = (edgeSide - this.pos.x) * 3;
            shotCallout = window.i18n ? window.i18n.t('ai_edge') : 'ÇİZGİYE VURUŞ! 🎯';
            calloutColor = '#ff1744';

        } else if (shotType === 'smash') {
            this.currentShotType = 'smash';
            let smashToLeft = playerX >= 0;
            if (arch.cornerTracking && Math.abs(playerX) > 0.18) {
                smashToLeft = playerX > 0;
            }
            targetX = smashToLeft ? -0.40 : 0.40;
            targetZ = 0.98;
            T = this.difficulty === 'hard' ? 0.37 : 0.39;
            topspin = this.difficulty === 'hard' ? 72 : 65;
            sidespin = (targetX - this.pos.x) * 4;
            shotCallout = window.i18n ? window.i18n.t('ai_smash') : 'AI SMAÇ! ⚡';
            calloutColor = '#ff1744';

        } else if (shotType === 'counter') {
            this.currentShotType = 'counter';
            targetX = -Math.sign(playerX || 1) * 0.40;
            targetZ = 0.98;
            T = 0.38;
            topspin = 70;
            sidespin = -Math.sign(playerX || 1) * 20;
            shotCallout = window.i18n ? window.i18n.t('ai_counter') : 'TERS KÖŞE! 🔄';
            calloutColor = '#e040fb';
            this.memory.comboState = 0;

        } else if (shotType === 'curve') {
            this.currentShotType = 'curve';
            const side = Math.random() < 0.5 ? -1 : 1;
            targetX = side * 0.36;
            targetZ = 0.94;
            T = 0.42;
            sidespin = side * (26 + (arch.maxSidespinBonus || 0));
            topspin = 50 + (arch.baseTopspinBonus || 0);
            shotCallout = window.i18n ? window.i18n.t('ai_curve') : 'KAVİSLİ TOP! 🌀';
            calloutColor = '#00e676';

        } else if (shotType === 'drive') {
            this.currentShotType = 'drive';
            let openSide = playerX > 0.05 ? -1 : (playerX < -0.05 ? 1 : (Math.random() < 0.5 ? -1 : 1));
            if (arch.cornerTracking && Math.abs(playerX) > 0.16) {
                openSide = -Math.sign(playerX);
            }
            targetX = openSide * this.profile.targetSpreadX;
            targetZ = this.profile.targetDepthZ[0] + Math.random() * (this.profile.targetDepthZ[1] - this.profile.targetDepthZ[0]);
            T = this.profile.baseFlightTime[0];
            topspin = this.profile.baseTopspin + 15;
            sidespin = openSide * (this.profile.maxSidespin * 0.8);

            shotCallout = openSide > 0
                ? (window.i18n ? window.i18n.t('ai_right_corner') : 'AI SAĞ KÖŞE! 🎯')
                : (window.i18n ? window.i18n.t('ai_left_corner') : 'AI SOL KÖŞE! 🎯');
            calloutColor = '#ff9100';

            if (this.difficulty === 'hard') {
                this.memory.comboState = 1;
            }

        } else {

            this.currentShotType = 'rally';
            let defaultX = (Math.random() - 0.5) * (this.profile.targetSpreadX * 1.5);
            if (arch.cornerTracking && Math.abs(playerX) > 0.22 && Math.random() < 0.60) {
                defaultX = -Math.sign(playerX) * (0.28 + Math.random() * 0.12);
            }
            targetX = defaultX;
            targetZ = this.profile.targetDepthZ[0] + Math.random() * (this.profile.targetDepthZ[1] - this.profile.targetDepthZ[0]);
            T = this.profile.baseFlightTime[0] + Math.random() * (this.profile.baseFlightTime[1] - this.profile.baseFlightTime[0]);
            topspin = this.profile.baseTopspin;
            sidespin = (targetX - this.pos.x) * 2;
        }



        const isPro = this.physics.isProMode && this.physics.isProMode();
        if (!isPro) {
            if (arch.id === 'titan' && ['drive', 'smash', 'chiquita'].includes(shotType)) {
                T *= 0.95;
                topspin += 8;
            } else if (arch.id === 'speed_counter' && ['rally', 'drive', 'counter'].includes(shotType)) {
                T *= 0.94;
            } else if (arch.id === 'spin_loop') {
                topspin += 12;
                sidespin *= 1.28;
            } else if (arch.id === 'defensive_wall' && shotType === 'chop') {
                T *= 1.06;
                topspin -= 8;
            } else if (arch.id === 'power_attack' && ['drive', 'smash'].includes(shotType)) {
                T *= 0.92;
                topspin += 10;
            }
            T = Math.max(0.34, Math.min(0.68, T));
        }


        if (isPro && shotType !== 'popup' && shotType !== 'weak') {
            targetX += (Math.random() - 0.5) * 0.045;
            targetZ += (Math.random() - 0.5) * 0.055;
        }


        const maxTargetX = isPro ? 0.56 : 0.43;
        const minTargetZ = isPro ? 0.28 : 0.35;
        const maxTargetZ = isPro ? 1.16 : 1.02;
        targetX = Math.max(-maxTargetX, Math.min(maxTargetX, targetX));
        targetZ = Math.max(minTargetZ, Math.min(maxTargetZ, targetZ));

        return {
            x: targetX,
            z: targetZ,
            T,
            topspin,
            sidespin,
            callout: shotCallout,
            calloutColor
        };
    }

    executeShot(shotType, target, responseQuality) {
        const panX = this.pos.x / 0.8;

        this.memory.previousShotType = shotType;
        this.memory.recentShotTypes.push(shotType);
        if (this.memory.recentShotTypes.length > 4) this.memory.recentShotTypes.shift();

        this.physics.hitTowards('opponent', target.x, target.z, target.T, target.topspin, target.sidespin, false);

        if (shotType === 'smash' || shotType === 'edgeKiller') {
            this.audio.play('smash', panX, 1.25);
            if (this.renderer && typeof this.renderer.addSmashSparks === 'function') {
                this.renderer.addSmashSparks(this.physics.pos);
            }
            if (this.renderer && typeof this.renderer.shake === 'function') {
                this.renderer.shake(0.04);
            }
            if (window.gameInstance && typeof window.gameInstance.showCallout === 'function' && target.callout) {
                window.gameInstance.showCallout(target.callout, target.calloutColor, 900);
            }
        } else if (shotType === 'drive' || shotType === 'counter' || shotType === 'curve' || shotType === 'chiquita' || target.T < 0.48) {

            this.audio.play('smash', panX, 1.15);
            if (this.renderer && typeof this.renderer.shake === 'function') {
                this.renderer.shake(0.02);
            }
            if (window.gameInstance && typeof window.gameInstance.showCallout === 'function' && target.callout && Math.random() < 0.85) {
                window.gameInstance.showCallout(target.callout, target.calloutColor, 800);
            }
        } else if (shotType === 'chop' || shotType === 'dropShot' || shotType === 'block') {

            this.audio.play('block', panX, shotType === 'block' ? 1.10 : 1.0);
            if (this.renderer && typeof this.renderer.shake === 'function' && shotType === 'block') {
                this.renderer.shake(0.015);
            }
            if (window.gameInstance && typeof window.gameInstance.showCallout === 'function' && target.callout) {
                window.gameInstance.showCallout(target.callout, target.calloutColor, 900);
            }
        } else if (shotType === 'popup') {

            this.audio.play('smash', panX, 0.85);
            if (window.gameInstance && typeof window.gameInstance.showCallout === 'function' && target.callout) {
                window.gameInstance.showCallout(target.callout, target.calloutColor, 1200);
            }
        } else {

            this.audio.play('smash', panX, 1.0);
        }
    }

    launchServe() {
        this.hitCooldown = 0.4;
        this.isSwinging = true;
        this.rallyHitCount = 0;
        this.memory.comboState = 0;

        if (window.gameInstance) {
            window.gameInstance.state = 'rally';
            window.gameInstance.isServe = true;
            window.gameInstance.rallyCount = 1;
            window.gameInstance.matchMaxRally = Math.max(window.gameInstance.matchMaxRally || 0, 1);
            if (window.gameInstance.proMatchStats) {
                window.gameInstance.proMatchStats.maxRally = Math.max(
                    window.gameInstance.proMatchStats.maxRally || 0,
                    1
                );
            }
            window.gameInstance.updateRallyCounter(1);
        }

        const panX = this.pos.x / 0.8;
        this.audio.play('smash', panX, 1.10);

        this.chooseServe();
    }

    chooseServe() {
        const playerPos = window.playerController ? window.playerController.pos : { x: 0 };
        let targetX = 0;
        let sidespin = 0;
        let targetZ = 1.10 + Math.random() * 0.08;

        if (this.difficulty === 'easy') {

            targetX = (Math.random() - 0.5) * 0.20;
            sidespin = 0;

        } else if (this.difficulty === 'medium') {

            const servePattern = Math.random();
            if (servePattern < 0.45) {
                targetX = 0.36 + Math.random() * 0.08;
                sidespin = 14;
                if (window.gameInstance && typeof window.gameInstance.showCallout === 'function') {
                    const callout = window.i18n ? window.i18n.t('ai_serve_right') : 'AI SERVİS ➔ SAĞ';
                    window.gameInstance.showCallout(callout, '#00e5ff', 800);
                }
            } else if (servePattern < 0.90) {
                targetX = -0.36 - Math.random() * 0.08;
                sidespin = -14;
                if (window.gameInstance && typeof window.gameInstance.showCallout === 'function') {
                    const callout = window.i18n ? window.i18n.t('ai_serve_left') : 'AI SERVİS ➔ SOL';
                    window.gameInstance.showCallout(callout, '#00e5ff', 800);
                }
            } else {
                targetX = 0;
                sidespin = 0;
            }

        } else if (this.difficulty === 'hard') {

            const servePattern = Math.random();
            if (servePattern < 0.45) {
                const side = playerPos.x < 0 ? 1 : -1;
                targetX = side * (0.45 + Math.random() * 0.08);
                sidespin = side * 22;
                targetZ = 1.18;
                if (window.gameInstance && typeof window.gameInstance.showCallout === 'function') {
                    const key = side > 0 ? 'ai_serve_right' : 'ai_serve_left';
                    const callout = window.i18n ? window.i18n.t(key) : (side > 0 ? 'AI SERVİS ➔ SAĞ' : 'AI SERVİS ➔ SOL');
                    window.gameInstance.showCallout(callout, '#00e5ff', 800);
                }
            } else if (servePattern < 0.78) {
                const side = Math.random() < 0.5 ? -1 : 1;
                targetX = side * (0.38 + Math.random() * 0.08);
                sidespin = side * 18;
                targetZ = 0.95;
            } else {
                targetX = (Math.random() - 0.5) * 0.15;
                sidespin = 0;
                targetZ = 1.20;
            }
        }

        this.physics.serveBall('opponent', targetX, targetZ, sidespin);
    }
}

window.TableTennisAI = TableTennisAI;
window.AI_ARCHETYPES = AI_ARCHETYPES;
window.AI_PROFILES = AI_PROFILES;
